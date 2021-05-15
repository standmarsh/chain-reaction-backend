import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(`${process.env.MONGO_URI_STRING_DEV}`, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`Connected to Mongo ${conn.connection.host}`);
  } catch (err) {
    logger.error(err);
  }
};

export default connectDB;
