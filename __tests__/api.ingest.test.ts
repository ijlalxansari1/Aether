import { POST as s3POST } from '@/app/api/ingest/s3/route';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn()
    })),
    GetObjectCommand: jest.fn()
  };
});

describe('Ingest API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('S3 POST', () => {
    it('returns 400 if missing connection details', async () => {
      const req = new Request('http://localhost/api/ingest/s3', {
        method: 'POST',
        body: JSON.stringify({ bucket: 'test' }) // Missing credentials
      });
      const res = await s3POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Missing connection details or object key');
    });

    it('returns parsed CSV data successfully', async () => {
      const csvContent = 'id,name\n1,Alice\n2,Bob';
      
      const mockSend = jest.fn().mockResolvedValue({
        Body: {
          transformToString: jest.fn().mockResolvedValue(csvContent)
        }
      });
      
      (S3Client as jest.Mock).mockImplementation(() => ({
        send: mockSend
      }));

      const req = new Request('http://localhost/api/ingest/s3', {
        method: 'POST',
        body: JSON.stringify({
          accessKeyId: '123',
          secretAccessKey: '456',
          region: 'us-east-1',
          bucket: 'test-bucket',
          key: 'data.csv'
        })
      });
      
      const res = await s3POST(req);
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.rowCount).toBe(2);
      expect(json.data[0]).toEqual({ id: '1', name: 'Alice' });
      expect(json.fields).toEqual(['id', 'name']);
    });

    it('returns 500 on S3 error', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Access Denied'));
      
      (S3Client as jest.Mock).mockImplementation(() => ({
        send: mockSend
      }));

      const req = new Request('http://localhost/api/ingest/s3', {
        method: 'POST',
        body: JSON.stringify({
          accessKeyId: '123',
          secretAccessKey: '456',
          region: 'us-east-1',
          bucket: 'test-bucket',
          key: 'data.csv'
        })
      });
      
      const res = await s3POST(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('Access Denied');
    });
  });
});
