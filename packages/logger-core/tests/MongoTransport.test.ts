import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MongoTransport } from '../src/transports/MongoTransport';
import { MongoClient } from 'mongodb';

// 1. Create spies for internal methods
// These need to be defined outside the mock so we can assert on them later
const insertOneMock = vi.fn().mockResolvedValue({ acknowledged: true });
const collectionMock = vi.fn().mockReturnValue({ insertOne: insertOneMock });
const dbMock = vi.fn().mockReturnValue({ collection: collectionMock });
const connectMock = vi.fn().mockResolvedValue(undefined);
const closeMock = vi.fn();

// 2. Mock the 'mongodb' module
vi.mock('mongodb', () => {
  return {
    // CRITICAL FIX: Use 'function' keyword here, NOT an arrow function.
    // This allows 'new MongoClient()' to work.
    MongoClient: vi.fn().mockImplementation(function () {
      return {
        connect: connectMock,
        db: dbMock,
        close: closeMock,
      };
    })
  };
});

describe('MongoTransport', () => {
  let transport: MongoTransport;
  let clientMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Instantiate the client. Since we used 'function()' above, 'new' will work.
    clientMock = new MongoClient('mongodb://mock-url:27017');

    // Initialize transport with the mocked client
    transport = new MongoTransport({
      client: clientMock,
      dbName: 'logs_test',
      collectionName: 'app_logs'
    });
  });

  it('should parse payload and insert valid JSON into Mongo', async () => {
    const validEntry = JSON.stringify({
      level: 'info',
      message: 'Database log',
      timestamp: 1234567890
    });

    await transport.log(validEntry);

    // Verify correct DB and Collection were accessed
    expect(dbMock).toHaveBeenCalledWith('logs_test');
    expect(collectionMock).toHaveBeenCalledWith('app_logs');

    // Verify insertOne was called with the PARSED object
    expect(insertOneMock).toHaveBeenCalledWith({
      level: 'info',
      message: 'Database log',
      timestamp: 1234567890
    });
  });

  it('should handle invalid JSON by logging raw string as error', async () => {
    const invalidPayload = 'This is not JSON';

    await transport.log(invalidPayload);

    // Verify fallback behavior
    expect(insertOneMock).toHaveBeenCalledWith(expect.objectContaining({
      level: 'error',
      message: 'This is not JSON'
    }));
  });
});