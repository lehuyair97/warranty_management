'use client';

import React from 'react';
import { IconSearch } from '@/assets/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export interface TrackingSearchFormProps {
  ticketCode: string;
  setTicketCode: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  isLoading: boolean;
  handleSearch: (e: React.FormEvent) => void;
  handleQuickLookup: (code: string, phone: string) => void;
}

/**
 * Public search input box component for warranty tracking.
 * Features dual-input validation, preset quick-fill buttons, and responsive layout.
 */
export const TrackingSearchForm = React.memo<TrackingSearchFormProps>(
  ({
    ticketCode,
    setTicketCode,
    phoneNumber,
    setPhoneNumber,
    isLoading,
    handleSearch,
    handleQuickLookup,
  }) => {
    return (
      <Card className="p-6 shadow-sm border-stone-200">
        <form onSubmit={handleSearch} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mã phiếu tiếp nhận"
              placeholder="VD: TK-0001"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
            />
            <Input
              label="Số điện thoại đăng ký"
              placeholder="VD: 0901234501"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-stone-500 flex items-center gap-2">
              <span>Gợi ý mẫu thử:</span>
              <button
                type="button"
                onClick={() => handleQuickLookup('TK-0001', '0901234501')}
                className="font-mono text-amber-800 font-semibold hover:underline cursor-pointer"
              >
                TK-0001 / 0901234501
              </button>
            </div>

            <Button
              type="submit"
              size="md"
              isLoading={isLoading}
              leftIcon={<IconSearch className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Tra cứu hồ sơ
            </Button>
          </div>
        </form>
      </Card>
    );
  },
);

TrackingSearchForm.displayName = 'TrackingSearchForm';
