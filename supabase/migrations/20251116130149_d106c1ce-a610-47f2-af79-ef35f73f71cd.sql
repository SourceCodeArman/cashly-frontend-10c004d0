-- Add unique constraint on plaid_transaction_id to allow upsert operations
ALTER TABLE transactions ADD CONSTRAINT transactions_plaid_transaction_id_key UNIQUE (plaid_transaction_id);