/**
 * Utility functions for fetching and computing customer statistics
 */

import { collections, pb } from '@/lib/pocketbase/client';
import type { Customer, CustomerWithStats, CustomerRentals } from '@/types';

// Max IDs per filter chunk. A big OR-chain in the filter string blows up
// at the URL length limit around a few hundred IDs; chunking keeps each
// request well below that even with room-to-spare margins.
const FILTER_CHUNK_SIZE = 100;

/**
 * Enriches an array of customers with their rental statistics
 * from the customer_rentals view
 *
 * @param customers - Array of customers to enrich
 * @returns Array of customers with stats added
 */
export async function enrichCustomersWithStats(
  customers: Customer[]
): Promise<CustomerWithStats[]> {
  if (customers.length === 0) {
    return [];
  }

  try {
    // Fetch stats in chunks so the OR-filter string never exceeds a
    // practical limit. Parallelises across chunks.
    const chunks: Customer[][] = [];
    for (let i = 0; i < customers.length; i += FILTER_CHUNK_SIZE) {
      chunks.push(customers.slice(i, i + FILTER_CHUNK_SIZE));
    }

    const statsRecordsByChunk = await Promise.all(
      chunks.map((chunk) => {
        const filter = chunk
          .map((c, i) => pb.filter(`id = {:id${i}}`, { [`id${i}`]: c.id }))
          .join(' || ');
        return collections.customerRentals().getFullList<CustomerRentals>({
          filter,
          fields: 'id,num_rentals,num_active_rentals',
        });
      })
    );

    // Flatten results and build map for quick lookup
    const statsMap = new Map<string, CustomerRentals>();
    for (const statsRecords of statsRecordsByChunk) {
      for (const stat of statsRecords) {
        statsMap.set(stat.id, stat);
      }
    }

    // Enrich customers with their stats
    return customers.map(customer => {
      const stats = statsMap.get(customer.id);
      return {
        ...customer,
        active_rentals: stats?.num_active_rentals || 0,
        total_rentals: stats?.num_rentals || 0,
      };
    });
  } catch (err) {
    console.error('Error fetching customer stats:', err);
    // On error, return customers with zero stats
    return customers.map(customer => ({
      ...customer,
      active_rentals: 0,
      total_rentals: 0,
    }));
  }
}
