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
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>#{tx.id}</td>
                  <td>{new Date(tx.createdAt || tx.transactionDate || Date.now()).toLocaleString()}</td>
                  <td className="font-bold">{tx.productName || `Product #${tx.productId}`}</td>
                  <td>
                    <span className={`transaction-type-badge type-${tx.transactionType?.toLowerCase()}`}>
                      {tx.transactionType}
                    </span>
                  </td>
                  <td className={`font-bold ${tx.quantityChange >= 0 || tx.transactionType === 'PURCHASE' ? 'text-success' : 'text-danger'}`}>
                    {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange || tx.quantity}
                  </td>
                  <td>{tx.remarks || tx.reason || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
