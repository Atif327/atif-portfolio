// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envFiles = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '.env.local'),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

const assistantChatRoute = require('./assistant-chat');
const reviewRoute = require('./reviews');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const hasSupabaseUpload = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
if (hasSupabaseUpload) {
  const uploadImageRoute = require('./upload-image');
  app.use('/api', uploadImageRoute);
} else {
  console.warn('Upload-image route disabled: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set.');
}
app.use('/api/assistant', assistantChatRoute);
app.use('/api', assistantChatRoute);
app.use('/api/reviews', reviewRoute);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
