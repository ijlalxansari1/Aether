import { render, screen, fireEvent } from '@testing-library/react';
import IngestStage from '@/components/stages/IngestStage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className }: any) => <div onClick={onClick} className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('IngestStage Component', () => {
  const defaultProps = {
    onIngest: jest.fn(),
    logs: [],
    hasData: false,
    datasets: [],
    onProceed: jest.fn(),
    onError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header and tabs', () => {
    render(<IngestStage {...defaultProps} />);
    
    expect(screen.getByText('Integration Hub')).toBeInTheDocument();
    expect(screen.getByText('Local & APIs')).toBeInTheDocument();
    expect(screen.getByText('Cloud & databases')).toBeInTheDocument();
    expect(screen.getByText('Sample datasets')).toBeInTheDocument();
  });

  it('renders local integration options by default', () => {
    render(<IngestStage {...defaultProps} />);
    
    expect(screen.getByText('Upload file')).toBeInTheDocument();
    expect(screen.getByText('REST API')).toBeInTheDocument();
    expect(screen.getByText('Paste CSV')).toBeInTheDocument();
    expect(screen.getByText('Parse PDF')).toBeInTheDocument();
  });

  it('switches to Cloud & databases tab', () => {
    render(<IngestStage {...defaultProps} />);
    
    const cloudTab = screen.getByText('Cloud & databases');
    fireEvent.click(cloudTab);
    
    expect(screen.getByText('Snowflake')).toBeInTheDocument();
    expect(screen.getByText('BigQuery')).toBeInTheDocument();
    expect(screen.getByText('AWS S3')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it('switches to Sample datasets tab', () => {
    render(<IngestStage {...defaultProps} />);
    
    const samplesTab = screen.getByText('Sample datasets');
    fireEvent.click(samplesTab);
    
    // Check if sample datasets are rendered
    expect(screen.getByText('sales')).toBeInTheDocument();
    expect(screen.getByText('hr')).toBeInTheDocument();
  });

  it('opens REST API modal', () => {
    render(<IngestStage {...defaultProps} />);
    
    const restCard = screen.getByText('REST API').closest('div');
    if (restCard) fireEvent.click(restCard);
    
    expect(screen.getByText('Connect REST API')).toBeInTheDocument();
  });
});
