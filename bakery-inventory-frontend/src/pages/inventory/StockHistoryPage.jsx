import React, { useEffect, useState } from 'react';
import { stockTransactionService } from '../../services/stockTransactionService';
import { History, Calendar, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * NEW FILE: StockHistoryPage Component
 * Transaction audit log table displaying past inventory additions, deductions, damages, and customer orders.
 */

export const StockHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await stockTransactionService.getAllTransactions();
        setTransactions(data || []);
      } catch (err) {
        console.error('Failed to load transaction history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="stock-history-page page-container">
      <Link to="/inventory/dashboard" className="back-link">
        <ArrowLeft size={18} /> Back to Inventory Dashboard
      </Link>

      <div className="page-header">
        <h1>Stock Transaction Audit Logs</h1>
        <p>Complete history of inventory movement, purchases, sales, damages, and returns</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw className="spinner" size={32} />
          <p>Fetching audit trail...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state card">
          <History size={48} />
          <h3>No Transactions Recorded</h3>
          <p>Stock transactions will appear here as inventory is purchased or orders are placed.</p>
        </div>
      ) : (
        <div className="table-responsive card">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Remarks / Details</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                // CHANGE: Backend StockTransactionResponse uses type, quantity, reason, createdAt, inventoryId
                const isPositive = tx.type === 'PURCHASE' || tx.type === 'CANCEL';
                const formattedType = tx.type || 'TRANSACTION';

                return (
                  <tr key={tx.id}>
                    <td>#{tx.id}</td>
                    <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</td>
                    <td className="font-bold">{tx.inventoryId ? `Inventory #${tx.inventoryId}` : `Tx #${tx.id}`}</td>
                    <td>
                      <span className={`transaction-type-badge type-${formattedType.toLowerCase().replace('_', '-')}`}>
                        {formattedType}
                      </span>
                    </td>
                    <td className={`font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                      {isPositive ? `+${tx.quantity}` : (tx.type === 'ADJUSTMENT' ? `${tx.quantity}` : `-${tx.quantity}`)}
                    </td>
                    <td>{tx.reason || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
