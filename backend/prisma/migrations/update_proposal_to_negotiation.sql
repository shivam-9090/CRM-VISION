-- Update all deals with PROPOSAL stage to NEGOTIATION
UPDATE deals SET stage = 'NEGOTIATION' WHERE stage = 'PROPOSAL';
