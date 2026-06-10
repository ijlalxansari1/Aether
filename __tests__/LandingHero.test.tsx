import { render, screen, fireEvent } from '@testing-library/react';
import LandingHero from '@/components/LandingHero';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className }: any) => <div onClick={onClick} className={className}>{children}</div>,
    h1: ({ children, className }: any) => <h1 className={className}>{children}</h1>,
    p: ({ children, className }: any) => <p className={className}>{children}</p>,
    span: ({ children, className }: any) => <span className={className}>{children}</span>,
    button: ({ children, onClick, className }: any) => <button onClick={onClick} className={className}>{children}</button>,
    a: ({ children, href, className }: any) => <a href={href} className={className}>{children}</a>,
  }
}));

describe('LandingHero Component', () => {
  it('renders the main headline and copy', () => {
    const onScrollMock = jest.fn();
    render(<LandingHero onScroll={onScrollMock} />);
    
    expect(screen.getByText(/Turn raw data into/i)).toBeInTheDocument();
    expect(screen.getByText(/insight, instantly./i)).toBeInTheDocument();
    expect(screen.getByText(/Aether is a browser-native DataOps pipeline/i)).toBeInTheDocument();
  });

  it('renders stats', () => {
    const onScrollMock = jest.fn();
    render(<LandingHero onScroll={onScrollMock} />);
    
    expect(screen.getByText('Pipeline Stages')).toBeInTheDocument();
    expect(screen.getByText('Browser Native')).toBeInTheDocument();
  });

  it('calls onScroll when Start Pipeline is clicked', () => {
    const onScrollMock = jest.fn();
    render(<LandingHero onScroll={onScrollMock} />);
    
    const startButton = screen.getByText('🚀 Start Pipeline');
    fireEvent.click(startButton);
    
    expect(onScrollMock).toHaveBeenCalledTimes(1);
  });

  it('renders Resume button only when hasSavedSession is true', () => {
    const onScrollMock = jest.fn();
    const onResumeMock = jest.fn();
    
    // Without session
    const { rerender } = render(<LandingHero onScroll={onScrollMock} onResume={onResumeMock} />);
    expect(screen.queryByText('♻️ Resume Workspace')).not.toBeInTheDocument();

    // With session
    rerender(<LandingHero onScroll={onScrollMock} hasSavedSession={true} onResume={onResumeMock} />);
    
    const resumeButton = screen.getByText('♻️ Resume Workspace');
    expect(resumeButton).toBeInTheDocument();
    
    fireEvent.click(resumeButton);
    expect(onResumeMock).toHaveBeenCalledTimes(1);
  });
});
