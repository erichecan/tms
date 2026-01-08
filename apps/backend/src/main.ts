
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001; // Frontend usually 5173

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
