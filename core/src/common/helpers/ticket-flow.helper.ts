import { EmployeeRole, TicketStatus } from '../constants';

/**
 * Valid state transition map for repair tickets.
 */
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.RECEIVED]: [
    TicketStatus.INSPECTING,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.INSPECTING]: [
    TicketStatus.WAITING_FOR_PARTS,
    TicketStatus.REPAIRING,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.WAITING_FOR_PARTS]: [
    TicketStatus.REPAIRING,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.REPAIRING]: [
    TicketStatus.WAITING_FOR_PARTS,
    TicketStatus.COMPLETED,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.COMPLETED]: [
    TicketStatus.DELIVERED,
    TicketStatus.REPAIRING, // In case QC fails post-check
  ],
  [TicketStatus.DELIVERED]: [], // Terminal state - cannot transition
  [TicketStatus.CANCELLED]: [], // Terminal state - cannot transition
};

/**
 * Pure helper function to validate state transition for repair tickets.
 * @param currentStatus Current ticket lifecycle status
 * @param nextStatus Desired next lifecycle status
 * @returns boolean true if the transition is allowed
 */
export function checkCanTransitionStatus(
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  const allowedNextStates = VALID_TRANSITIONS[currentStatus];
  if (!allowedNextStates) {
    return false;
  }

  return allowedNextStates.includes(nextStatus);
}

/**
 * Parses user input ticket code into numeric ticket ID.
 * Handles inputs like "10", "TK-0010", "tk-12", "#45".
 * @param code Raw ticket code string
 * @returns Numeric ID or null if unparseable
 */
export function parseTicketCode(code: string): number | null {
  if (!code || typeof code !== 'string') {
    return null;
  }

  const digits = code.replace(/[^0-9]/g, '');
  if (!digits) {
    return null;
  }

  const id = parseInt(digits, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * Formats numeric ticket ID into standard alphanumeric code for customer-facing documents.
 * @param id Numeric ticket identifier
 * @returns Formatted ticket code e.g. "TK-0005"
 */
export function formatTicketCode(id: number): string {
  return `TK-${id.toString().padStart(4, '0')}`;
}

/**
 * Masks customer phone number for public display security.
 * E.g., "0901234567" -> "09****4567"
 * @param phone Raw phone number
 * @returns Masked phone string
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) {
    return phone || '';
  }

  const prefix = phone.slice(0, 2);
  const suffix = phone.slice(-4);
  return `${prefix}****${suffix}`;
}

export interface UserRolePayload {
  id: number;
  role: EmployeeRole;
}

/**
 * Validates role-based permissions when assigning or reassigning a technician to a ticket.
 * - Receptionists and Managers have full authority to assign or reassign any technician.
 * - Technicians can ONLY self-assign unassigned tickets. Once assigned, technicians cannot reassign.
 * @returns Human-friendly error message if forbidden, or null if valid.
 */
export function checkTechnicianAssignmentViolation(
  currentUser: UserRolePayload | undefined,
  existingTechnicianId: number | null | undefined,
  targetTechnicianId: number,
): string | null {
  if (!currentUser) return null;

  if (currentUser.role === EmployeeRole.TECHNICIAN) {
    if (targetTechnicianId !== currentUser.id) {
      return 'Kỹ thuật viên chỉ có thể tự nhận phiếu cho chính mình.';
    }
    if (existingTechnicianId !== null && existingTechnicianId !== undefined) {
      return 'Phiếu này đã có kỹ thuật viên phụ trách. Chỉ Lễ tân hoặc Quản lý mới có quyền điều phối lại.';
    }
  }

  return null;
}

/**
 * Validates role-based permissions when processing or updating ticket progress/diagnosis.
 * - Receptionists and Managers can process/update any ticket.
 * - Technicians can only process tickets assigned to themselves (or claim an unassigned ticket).
 * - Technicians cannot change the assigned technician on an already assigned ticket.
 * @returns Human-friendly error message if forbidden, or null if valid.
 */
export function checkTicketProcessViolation(
  currentUser: UserRolePayload | undefined,
  existingTechnicianId: number | null | undefined,
  targetTechnicianId: number | null | undefined,
): string | null {
  if (!currentUser) return null;

  if (currentUser.role === EmployeeRole.TECHNICIAN) {
    // Cannot modify another technician's ticket
    if (
      existingTechnicianId !== null &&
      existingTechnicianId !== undefined &&
      existingTechnicianId !== currentUser.id
    ) {
      return 'Bạn không phải là kỹ thuật viên được phân công cho phiếu này.';
    }

    // If targetTechnicianId is explicitly specified in update payload:
    if (targetTechnicianId !== undefined && targetTechnicianId !== null) {
      if (targetTechnicianId !== currentUser.id) {
        return 'Kỹ thuật viên không có quyền thay đổi người phụ trách phiếu sửa chữa.';
      }
      if (
        existingTechnicianId !== null &&
        existingTechnicianId !== undefined &&
        targetTechnicianId !== existingTechnicianId
      ) {
        return 'Phiếu này đã có kỹ thuật viên phụ trách. Chỉ Lễ tân hoặc Quản lý mới có quyền điều phối lại.';
      }
    }
  }

  return null;
}

