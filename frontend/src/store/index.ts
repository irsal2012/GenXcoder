import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import conversationReducer from './conversationSlice';

const persistConfig = {
  key: 'genxcoder-conversation',
  storage,
  whitelist: ['userPreferences', 'conversationId'] // Only persist user preferences and conversation ID
};

const persistedConversationReducer = persistReducer(persistConfig, conversationReducer);

export const store = configureStore({
  reducer: {
    conversation: persistedConversationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['conversation.messages.timestamp', 'conversation.startedAt', 'conversation.lastActivity']
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
