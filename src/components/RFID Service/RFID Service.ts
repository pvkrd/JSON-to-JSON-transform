To create a production-ready RFID Service component based on the provided requirements, we will use Node.js with TypeScript and the Express framework. The service will include functionalities for reading RFID tags, processing and storing data, and publishing events to Azure Event Hub. Below is a structured approach to implementing this service:

### Project Structure

```
rfid-service/
│
├── src/
│   ├── controllers/
│   │   └── rfidController.ts
│   ├── services/
│   │   ├── rfidReaderService.ts
│   │   ├── dataProcessingService.ts
│   │   └── eventPublisherService.ts
│   ├── models/
│   │   └── rfidTag.ts
│   ├── utils/
│   │   ├── errorHandler.ts
│   │   └── validator.ts
│   ├── config/
│   │   └── azureConfig.ts
│   ├── app.ts
│   └── server.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

### Code Implementation

#### `app.ts`

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import { rfidRouter } from './controllers/rfidController';
import { errorHandler } from './utils/errorHandler';

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/rfid', rfidRouter);

// Error Handling
app.use(errorHandler);

export default app;
```

#### `server.ts`

```typescript
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`RFID Service is running on port ${PORT}`);
});
```

#### `controllers/rfidController.ts`

```typescript
import express, { Request, Response, NextFunction } from 'express';
import { readRFIDTag } from '../services/rfidReaderService';
import { validateRFIDInput } from '../utils/validator';

export const rfidRouter = express.Router();

rfidRouter.post('/read', validateRFIDInput, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tagData = await readRFIDTag(req.body);
    res.status(200).json(tagData);
  } catch (error) {
    next(error);
  }
});
```

#### `services/rfidReaderService.ts`

```typescript
import { processRFIDData } from './dataProcessingService';
import { publishEvent } from './eventPublisherService';

export async function readRFIDTag(tagInfo: any) {
  // Simulate RFID tag reading
  const tagData = {
    id: tagInfo.id,
    timestamp: new Date(),
    location: tagInfo.location,
    inventoryDetails: tagInfo.inventoryDetails
  };

  // Process and store data
  await processRFIDData(tagData);

  // Publish event
  await publishEvent(tagData);

  return tagData;
}
```

#### `services/dataProcessingService.ts`

```typescript
import { AzureSQLDatabase } from '../config/azureConfig';

export async function processRFIDData(tagData: any) {
  // Store data in Azure SQL Database
  const query = `INSERT INTO RFIDTags (TagID, Timestamp, Location, InventoryDetails) VALUES (?, ?, ?, ?)`;
  await AzureSQLDatabase.execute(query, [tagData.id, tagData.timestamp, tagData.location, tagData.inventoryDetails]);
}
```

#### `services/eventPublisherService.ts`

```typescript
import { EventHubProducerClient } from '@azure/event-hubs';
import { azureEventHubConfig } from '../config/azureConfig';

const producer = new EventHubProducerClient(azureEventHubConfig.connectionString, azureEventHubConfig.eventHubName);

export async function publishEvent(tagData: any) {
  const batch = await producer.createBatch();
  batch.tryAdd({ body: tagData });
  await producer.sendBatch(batch);
}
```

#### `utils/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
}
```

#### `utils/validator.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export function validateRFIDInput(req: Request, res: Response, next: NextFunction) {
  const { id, location, inventoryDetails } = req.body;
  if (!id || !location || !inventoryDetails) {
    return res.status(400).json({ error: 'Invalid input data' });
  }
  next();
}
```

#### `config/azureConfig.ts`

```typescript
export const azureEventHubConfig = {
  connectionString: process.env.AZURE_EVENT_HUB_CONNECTION_STRING || '',
  eventHubName: process.env.AZURE_EVENT_HUB_NAME || ''
};

export const AzureSQLDatabase = {
  execute: async (query: string, params: any[]) => {
    // Implement Azure SQL Database connection and query execution
  }
};
```

### Additional Considerations

- **Error Handling**: Centralized error handling is implemented using the `errorHandler` middleware.
- **Input Validation**: Basic input validation is performed in the `validateRFIDInput` middleware.
- **Environment Variables**: Sensitive information like connection strings should be stored in environment variables.
- **Scalability**: The service is designed to be stateless, allowing for easy horizontal scaling.
- **Security**: Ensure all data in transit is encrypted using TLS 1.3, and sensitive data is stored securely.
- **Performance**: Use connection pooling for database connections and batch processing for event publishing to handle high throughput.

This implementation provides a solid foundation for the RFID Service component, adhering to the specified requirements and best practices.