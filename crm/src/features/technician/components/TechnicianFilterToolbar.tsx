'use client';

import React from 'react';
import { SegmentedControl, SegmentedControlOption } from '@/components/core';

export interface TechnicianFilterToolbarProps {
  filterMyTicketsOnly: boolean;
  onChange: (value: boolean) => void;
}

const TECH_FILTER_OPTIONS: SegmentedControlOption<boolean>[] = [
  { value: false, label: 'Tất cả phiếu' },
  { value: true, label: 'Phiếu của tôi', variant: 'amber' },
];

/**
 * Technician workbench filter toolbar component.
 * Encapsulates ticket ownership filter options inside the technician feature module.
 */
export const TechnicianFilterToolbar = React.memo<TechnicianFilterToolbarProps>(
  ({ filterMyTicketsOnly, onChange }) => {
    return (
      <SegmentedControl
        value={filterMyTicketsOnly}
        onChange={onChange}
        options={TECH_FILTER_OPTIONS}
      />
    );
  },
);

TechnicianFilterToolbar.displayName = 'TechnicianFilterToolbar';
