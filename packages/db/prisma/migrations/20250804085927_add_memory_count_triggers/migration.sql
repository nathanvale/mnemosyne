-- Fix existing memoryCount values to match actual membership counts
UPDATE MemoryCluster
SET memoryCount = (
  SELECT COUNT(*)
  FROM ClusterMembership
  WHERE ClusterMembership.clusterId = MemoryCluster.clusterId
);

-- Create trigger to increment memoryCount when a memory is added to a cluster
CREATE TRIGGER increment_memory_count_on_insert
AFTER INSERT ON ClusterMembership
FOR EACH ROW
BEGIN
  UPDATE MemoryCluster
  SET memoryCount = memoryCount + 1,
      updatedAt = CURRENT_TIMESTAMP
  WHERE clusterId = NEW.clusterId;
END;

-- Create trigger to decrement memoryCount when a memory is removed from a cluster
CREATE TRIGGER decrement_memory_count_on_delete
AFTER DELETE ON ClusterMembership
FOR EACH ROW
BEGIN
  UPDATE MemoryCluster
  SET memoryCount = memoryCount - 1,
      updatedAt = CURRENT_TIMESTAMP
  WHERE clusterId = OLD.clusterId;
END;

-- Create trigger to handle updates (if membership is moved between clusters)
CREATE TRIGGER update_memory_count_on_update
AFTER UPDATE OF clusterId ON ClusterMembership
FOR EACH ROW
WHEN OLD.clusterId != NEW.clusterId
BEGIN
  -- Decrement count from old cluster
  UPDATE MemoryCluster
  SET memoryCount = memoryCount - 1,
      updatedAt = CURRENT_TIMESTAMP
  WHERE clusterId = OLD.clusterId;
  
  -- Increment count in new cluster
  UPDATE MemoryCluster
  SET memoryCount = memoryCount + 1,
      updatedAt = CURRENT_TIMESTAMP
  WHERE clusterId = NEW.clusterId;
END;

-- Add a CHECK constraint to ensure memoryCount never goes negative
-- SQLite doesn't support adding CHECK constraints to existing tables,
-- so we'll handle this in the triggers by using MAX(0, memoryCount - 1)
DROP TRIGGER IF EXISTS decrement_memory_count_on_delete;
CREATE TRIGGER decrement_memory_count_on_delete
AFTER DELETE ON ClusterMembership
FOR EACH ROW
BEGIN
  UPDATE MemoryCluster
  SET memoryCount = MAX(0, memoryCount - 1),
      updatedAt = CURRENT_TIMESTAMP
  WHERE clusterId = OLD.clusterId;
END;

-- Update the update trigger as well to prevent negative counts
DROP TRIGGER IF EXISTS update_memory_count_on_update;
CREATE TRIGGER update_memory_count_on_update
AFTER UPDATE OF clusterId ON ClusterMembership
FOR EACH ROW
WHEN OLD.clusterId != NEW.clusterId
BEGIN
  -- Decrement count from old cluster (prevent negative)
  UPDATE MemoryCluster
  SET memoryCount = MAX(0, memoryCount - 1),
      updatedAt = CURRENT_TIMESTAMP
  WHERE clusterId = OLD.clusterId;
  
  -- Increment count in new cluster
  UPDATE MemoryCluster
  SET memoryCount = memoryCount + 1,
      updatedAt = CURRENT_TIMESTAMP
  WHERE clusterId = NEW.clusterId;
END;