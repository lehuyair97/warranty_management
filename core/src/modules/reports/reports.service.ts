import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TicketStatus } from '@/common/constants';
import { CustomerEntity } from '@/database/entities/customer.entity';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { PartEntity } from '@/database/entities/part.entity';
import { TicketEntity } from '@/database/entities/ticket.entity';

export interface DelayedTicketReportRow {
  ticket_id: number;
  customer_name: string;
  phone_number: string;
  device_name: string;
  status: string;
  overdue_days: number;
  assigned_technician: string | null;
}

export interface AuditReportResult {
  discrepanciesFound: number;
  wasAutoFixed: boolean;
}

/**
 * Service generating operational reports, invoice audit reconciliations,
 * and high-level dashboard performance summaries.
 */
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepo: Repository<TicketEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(PartEntity)
    private readonly partRepo: Repository<PartEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves overdue tickets via stored procedure sp_alert_delayed_tickets.
   */
  async getDelayedTickets(delayDays: number = 14): Promise<DelayedTicketReportRow[]> {
    const rawResults: DelayedTicketReportRow[] = await this.dataSource.query(
      `EXEC dbo.sp_alert_delayed_tickets @delay_days = @0;`,
      [delayDays],
    );

    return rawResults || [];
  }

  /**
   * Runs data reconciliation cursor via stored procedure sp_audit_invoices.
   */
  async auditInvoices(autoFix: boolean = false): Promise<AuditReportResult> {
    const bitValue = autoFix ? 1 : 0;
    const rawResults = await this.dataSource.query(
      `EXEC dbo.sp_audit_invoices @auto_fix = @0;`,
      [bitValue],
    );

    const first = rawResults?.[0] || {};
    return {
      discrepanciesFound: Number(first.discrepancies_found || 0),
      wasAutoFixed: Boolean(first.was_auto_fixed),
    };
  }

  /**
   * Compiles executive dashboard statistics across tickets, revenue, customers, and parts.
   */
  async getDashboardSummary() {
    const [
      totalTickets,
      activeTickets,
      completedTickets,
      deliveredTickets,
      totalCustomers,
      lowStockPartsCount,
    ] = await Promise.all([
      this.ticketRepo.count(),
      this.ticketRepo.count({
        where: [
          { status: TicketStatus.RECEIVED },
          { status: TicketStatus.INSPECTING },
          { status: TicketStatus.WAITING_FOR_PARTS },
          { status: TicketStatus.REPAIRING },
        ],
      }),
      this.ticketRepo.count({ where: { status: TicketStatus.COMPLETED } }),
      this.ticketRepo.count({ where: { status: TicketStatus.DELIVERED } }),
      this.customerRepo.count(),
      this.partRepo
        .createQueryBuilder('p')
        .where('p.stockQuantity <= 5')
        .getCount(),
    ]);

    // Compute total revenue from paid invoices
    const revenueResult = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.totalAmount)', 'total')
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.total || '0');

    // Aggregate tickets by status
    const statusCountsRaw = await this.ticketRepo
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(t.id)', 'count')
      .groupBy('t.status')
      .getRawMany();

    const ticketsByStatus: Record<string, number> = {};
    for (const row of statusCountsRaw) {
      ticketsByStatus[row.status] = parseInt(row.count, 10);
    }

    // Aggregate tickets by type (warranty vs repair)
    const typeCountsRaw = await this.ticketRepo
      .createQueryBuilder('t')
      .select('t.ticketType', 'ticketType')
      .addSelect('COUNT(t.id)', 'count')
      .groupBy('t.ticketType')
      .getRawMany();

    const ticketsByType: Record<string, number> = {};
    for (const row of typeCountsRaw) {
      ticketsByType[row.ticketType] = parseInt(row.count, 10);
    }

    // Aggregate monthly trends for the last 6 months
    let monthlyTrends: { month: string; tickets: number; revenue: number }[] = [];
    try {
      const [monthlyTicketsRaw, monthlyRevenueRaw] = await Promise.all([
        this.dataSource.query(`
          SELECT 
            FORMAT(received_at, 'yyyy-MM') AS month_label,
            COUNT(id) AS ticket_count
          FROM dbo.tickets
          WHERE received_at >= DATEADD(month, -5, DATEADD(day, 1-DAY(GETDATE()), CAST(GETDATE() AS DATE)))
          GROUP BY FORMAT(received_at, 'yyyy-MM')
          ORDER BY month_label ASC;
        `),
        this.dataSource.query(`
          SELECT 
            FORMAT(created_at, 'yyyy-MM') AS month_label,
            SUM(total_amount) AS total_revenue
          FROM dbo.invoices
          WHERE created_at >= DATEADD(month, -5, DATEADD(day, 1-DAY(GETDATE()), CAST(GETDATE() AS DATE)))
          GROUP BY FORMAT(created_at, 'yyyy-MM')
          ORDER BY month_label ASC;
        `),
      ]);

      const monthMap = new Map<string, { month: string; tickets: number; revenue: number }>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, { month: key, tickets: 0, revenue: 0 });
      }

      for (const r of monthlyTicketsRaw || []) {
        const entry = monthMap.get(r.month_label);
        if (entry) {
          entry.tickets = parseInt(r.ticket_count, 10) || 0;
        }
      }
      for (const r of monthlyRevenueRaw || []) {
        const entry = monthMap.get(r.month_label);
        if (entry) {
          entry.revenue = parseFloat(r.total_revenue) || 0;
        }
      }
      monthlyTrends = Array.from(monthMap.values());
    } catch {
      monthlyTrends = [];
    }

    // Aggregate top 5 consumed spare parts from paid invoices
    let topParts: { id: number; partName: string; unit: string; totalQuantity: number; totalAmount: number }[] = [];
    try {
      const topPartsRaw: Record<string, unknown>[] = await this.dataSource.query(`
        SELECT TOP 5
          p.id,
          p.part_name AS partName,
          p.unit,
          SUM(ii.quantity) AS totalQuantity,
          SUM(ii.total_price) AS totalAmount
        FROM dbo.invoice_items ii
        INNER JOIN dbo.parts p ON ii.part_id = p.id
        INNER JOIN dbo.invoices inv ON ii.invoice_id = inv.id
        GROUP BY p.id, p.part_name, p.unit
        ORDER BY totalQuantity DESC, totalAmount DESC;
      `);
      topParts = (topPartsRaw || []).map((row) => ({
        id: Number(row.id),
        partName: String(row.partName),
        unit: String(row.unit),
        totalQuantity: parseInt(String(row.totalQuantity), 10) || 0,
        totalAmount: parseFloat(String(row.totalAmount)) || 0,
      }));
    } catch {
      topParts = [];
    }

    // Aggregate top 5 active technicians by resolved tickets and total workload
    let topTechnicians: { id: number; name: string; totalHandled: number; completedCount: number }[] = [];
    try {
      const topTechsRaw: Record<string, unknown>[] = await this.dataSource.query(`
        SELECT TOP 5
          e.id,
          e.full_name AS name,
          COUNT(t.id) AS totalHandled,
          SUM(CASE WHEN t.status IN ('completed', 'delivered', 'paid') THEN 1 ELSE 0 END) AS completedCount
        FROM dbo.employees e
        INNER JOIN dbo.tickets t ON e.id = t.technician_id
        WHERE e.role = 'technician' AND e.is_active = 1
        GROUP BY e.id, e.full_name
        ORDER BY completedCount DESC, totalHandled DESC;
      `);
      topTechnicians = (topTechsRaw || []).map((row) => ({
        id: Number(row.id),
        name: String(row.name),
        totalHandled: parseInt(String(row.totalHandled), 10) || 0,
        completedCount: parseInt(String(row.completedCount), 10) || 0,
      }));
    } catch {
      topTechnicians = [];
    }

    return {
      overview: {
        totalTickets,
        activeTickets,
        completedTickets,
        deliveredTickets,
        totalCustomers,
        totalRevenue,
        lowStockPartsCount,
      },
      distribution: {
        byStatus: ticketsByStatus,
        byType: ticketsByType,
      },
      monthlyTrends,
      topParts,
      topTechnicians,
    };
  }
}
