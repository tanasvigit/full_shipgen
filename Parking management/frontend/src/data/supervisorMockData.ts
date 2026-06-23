import type { ActiveOperator, OperatorActivity, QrScanEvent, RecentExit, SupervisorAlert } from '../types';

export const mockActiveOperators: ActiveOperator[] = [
  { id: 'U002', name: 'Priya Sharma', shift: 'Morning', ticketsIssued: 42, status: 'Active' },
  { id: 'U003', name: 'Amit Patel', shift: 'Morning', ticketsIssued: 38, status: 'Active' },
  { id: 'U005', name: 'Vikram Singh', shift: 'Afternoon', ticketsIssued: 21, status: 'On Break' },
];

export const mockSupervisorAlerts: SupervisorAlert[] = [
  {
    id: 'AL-S01',
    severity: 'high',
    title: 'Exit lane congestion',
    detail: 'Average exit wait time exceeded 6 minutes at Main Gate Exit.',
    time: '11:18 AM',
  },
  {
    id: 'AL-S02',
    severity: 'medium',
    title: 'Thermal printer offline',
    detail: 'Operator desk printer has not responded for 15 minutes.',
    time: '11:05 AM',
  },
  {
    id: 'AL-S03',
    severity: 'low',
    title: 'Unpaid ticket backlog',
    detail: '4 unpaid tickets are pending collection for more than 30 minutes.',
    time: '10:52 AM',
  },
];

export const mockQrScanActivity: QrScanEvent[] = [
  { id: 'QR001', ticket: 'PK102391', vehicle: 'AP31CD9988', action: 'Entry Scan', status: 'Valid', time: '10:12 AM' },
  { id: 'QR002', ticket: 'PK102392', vehicle: 'TS09XY4455', action: 'Entry Scan', status: 'Valid', time: '10:18 AM' },
  { id: 'QR003', ticket: 'PK102390', vehicle: 'KA01AB1234', action: 'Exit Scan', status: 'Invalid', time: '10:20 AM' },
  { id: 'QR004', ticket: 'PK102393', vehicle: 'AP39AB1234', action: 'Entry Scan', status: 'Valid', time: '10:22 AM' },
  { id: 'QR005', ticket: 'PK102397', vehicle: 'DL08ST7788', action: 'Exit Scan', status: 'Valid', time: '10:30 AM' },
];

export const mockOperatorActivity: OperatorActivity[] = [
  {
    id: 'OA001',
    operator: 'Priya Sharma',
    action: 'Ticket Created',
    ticketId: 'PK102391',
    vehicle: 'AP31CD9988',
    time: '10:12 AM',
  },
  {
    id: 'OA002',
    operator: 'Priya Sharma',
    action: 'Payment Collected',
    ticketId: 'PK102392',
    vehicle: 'TS09XY4455',
    time: '10:18 AM',
  },
  {
    id: 'OA003',
    operator: 'Amit Patel',
    action: 'Ticket Created',
    ticketId: 'PK102393',
    vehicle: 'AP39AB1234',
    time: '10:22 AM',
  },
  {
    id: 'OA004',
    operator: 'Amit Patel',
    action: 'QR Reprint',
    ticketId: 'PK102395',
    vehicle: 'TN22AB3344',
    time: '10:45 AM',
  },
  {
    id: 'OA005',
    operator: 'Vikram Singh',
    action: 'Payment Collected',
    ticketId: 'PK102394',
    vehicle: 'KA05MN7890',
    time: '11:02 AM',
  },
];

export const mockRecentExits: RecentExit[] = [
  { vehicle: 'DL08ST7788', category: '4 Wheeler', time: '10:30 AM', ticketId: 'PK102397' },
  { vehicle: 'AP11XY2233', category: '2 Wheeler', time: '10:34 AM', ticketId: 'PK102388' },
  { vehicle: 'TS07AB7788', category: 'Heavy Vehicles', time: '10:41 AM', ticketId: 'PK102386' },
  { vehicle: 'KA03CD1122', category: '4 Wheeler', time: '10:48 AM', ticketId: 'PK102385' },
];
