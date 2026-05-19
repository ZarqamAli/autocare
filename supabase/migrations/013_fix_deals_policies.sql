-- ============================================================
-- 013: Fix deals INSERT/UPDATE policies + sold listing visibility
-- ============================================================

-- deals: seller (or buyer via fire-and-forget) can create deal
-- after offer accepted. Use service-role for auto-creation,
-- but also allow conversation participants to create.
CREATE POLICY "Participants can create deal"
  ON deals FOR INSERT
  WITH CHECK (
    (buyer_id = auth.uid() OR seller_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = deals.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- deals: buyer confirms buyer_confirmed_at; seller confirms seller_confirmed_at
CREATE POLICY "Participants can confirm deal"
  ON deals FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR is_admin());

-- listings: buyers can also read sold listings (for SOLD stamp feature)
CREATE POLICY "Public can read sold listings"
  ON listings FOR SELECT
  USING (status = 'sold');
