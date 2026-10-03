'use client';

import { useState } from 'react';
import { ticketsService } from '@/services/tickets.service';
import { getErrorMessage, PublicTicketTracking } from '@/types';

/**
 * Custom hook managing public ticket tracking search state and actions.
 */
export function usePublicTracking() {
  const [ticketCode, setTicketCode] = useState('TK-0001');
  const [phoneNumber, setPhoneNumber] = useState('0901234501');
  const [isLoading, setIsLoading] = useState(false);
  const [ticket, setTicket] = useState<PublicTicketTracking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ticketCode || !phoneNumber) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await ticketsService.trackPublicTicket({
        ticketCode: ticketCode.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setTicket(res);
    } catch (err: unknown) {
      setTicket(null);
      setError(
        getErrorMessage(
          err,
          'Không tìm thấy hồ sơ phiếu bảo hành phù hợp với mã phiếu và số điện thoại đã nhập.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLookup = (code: string, phone: string) => {
    setTicketCode(code);
    setPhoneNumber(phone);
  };

  return {
    ticketCode,
    setTicketCode,
    phoneNumber,
    setPhoneNumber,
    isLoading,
    ticket,
    error,
    handleSearch,
    handleQuickLookup,
  };
}
