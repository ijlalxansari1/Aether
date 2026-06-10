import { render, screen } from '@testing-library/react';
import GlobalSidebar from '@/components/GlobalSidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/')
}));

describe('GlobalSidebar Component', () => {
  it('renders the brand logo and text', () => {
    render(<GlobalSidebar />);
    expect(screen.getByText('Aether')).toBeInTheDocument();
    expect(screen.getByText('v1.0')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<GlobalSidebar />);
    expect(screen.getByText('Pipelines')).toBeInTheDocument();
    expect(screen.getByText('Ethics & Governance')).toBeInTheDocument();
    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('AI Copilot')).toBeInTheDocument();
  });

  it('sets active class based on pathname', () => {
    render(<GlobalSidebar />);
    const pipelinesLink = screen.getByText('Pipelines').closest('a');
    expect(pipelinesLink).toHaveClass('active');

    const ethicsLink = screen.getByText('Ethics & Governance').closest('a');
    expect(ethicsLink).not.toHaveClass('active');
  });

  it('renders the system status footer', () => {
    render(<GlobalSidebar />);
    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
  });
});
