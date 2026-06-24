import { useState, useEffect } from 'react';
import { connectWallet, getBalance, sendPayment } from './stellar';
import { logPayment, getPaymentLog, getTotalByCategory, CONTRACT_ADDRESS } from './paymentLogger';
import './index.css';

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  
  // Transaction State
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState(''); // pending, success, failed
  const [txHash, setTxHash] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Payment Logger State
  const [showLogForm, setShowLogForm] = useState(false);
  const [logCategory, setLogCategory] = useState('Other');
  const [logNote, setLogNote] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  // Insights & History State
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [insights, setInsights] = useState({});
  const categories = ['Rent', 'Family_Support', 'Business', 'Savings', 'Other']; // Ensure these match symbol requirements (no spaces)

  const fetchBalance = async (pubKey) => {
    try {
      const bal = await getBalance(pubKey);
      setBalance(bal);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogsAndInsights = async (pubKey) => {
    try {
      const logs = await getPaymentLog(pubKey);
      setPaymentLogs(logs || []);
      
      const newInsights = {};
      for (const cat of categories) {
        const total = await getTotalByCategory(pubKey, cat);
        newInsights[cat] = Number(total) / 10000000; // Convert stroops back to XLM
      }
      setInsights(newInsights);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  useEffect(() => {
    if (!publicKey) return;

    const interval = setInterval(() => {
      fetchBalance(publicKey);
    }, 10000);

    fetchLogsAndInsights(publicKey);

    return () => clearInterval(interval);
  }, [publicKey]);

  const handleConnect = async () => {
    try {
      setStatus('');
      setIsConnecting(true);
      const pubKey = await connectWallet();
      setPublicKey(pubKey);
    } catch (err) {
      setStatusType('failed');
      setStatus(`Error connecting wallet: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setPublicKey('');
    setBalance('');
    setDestination('');
    setAmount('');
    setStatus('');
    setTxHash('');
    setShowLogForm(false);
    setPaymentLogs([]);
    setInsights({});
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!destination || !amount) {
      setStatusType('failed');
      setStatus('Please enter destination and amount');
      return;
    }
    try {
      setStatusType('pending');
      setStatus('Transaction submitted, waiting...');
      setTxHash('');
      setIsSending(true);
      const response = await sendPayment(destination, amount, publicKey);
      setTxHash(response.hash || response.id);
      setStatusType('success');
      setStatus('Transaction successful! You can now log this payment.');
      await fetchBalance(publicKey);
      setShowLogForm(true); // Show log form after successful payment
    } catch (err) {
      setStatusType('failed');
      setStatus(`Transaction failed: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogPayment = async (e) => {
    e.preventDefault();
    if (!amount) return; // Use the amount from the previous transaction
    try {
      setIsLogging(true);
      setStatusType('pending');
      setStatus('Logging payment on-chain, waiting...');
      setTxHash('');
      const response = await logPayment(publicKey, logCategory, amount, logNote);
      setTxHash(response.hash || response.id);
      setStatusType('success');
      setStatus('Payment logged successfully!');
      setShowLogForm(false);
      await fetchLogsAndInsights(publicKey); // Refresh logs and insights
    } catch (err) {
      setStatusType('failed');
      setStatus(`Logging failed: ${err.message}`);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Stellar Payment dApp</h1>
        <p className="subtitle">RemitFlow Payment Logger</p>

        {!publicKey ? (
          <button className="btn primary" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="wallet-info">
            <div className="info-row">
              <span className="label">Public Key:</span>
              <span className="value truncate" title={publicKey}>{publicKey}</span>
            </div>
            <div className="info-row">
              <span className="label">Balance:</span>
              <span className="value xl">{balance} XLM</span>
            </div>
            <button className="btn secondary" onClick={handleDisconnect}>
              Disconnect
            </button>

            <form onSubmit={handleSend} className="send-form">
              <h3>Send XLM</h3>
              <div className="form-group">
                <label>Destination Address</label>
                <input
                  type="text"
                  placeholder="G..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (XLM)</label>
                <input
                  type="number"
                  step="0.0000001"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <button className="btn primary full" type="submit" disabled={isSending}>
                {isSending ? 'Processing...' : 'Send Transaction'}
              </button>
            </form>

            {showLogForm && (
              <form onSubmit={handleLogPayment} className="contract-form">
                <h3>Log this payment</h3>
                <p className="small-text">Categorize your payment on-chain.</p>
                <div className="form-group">
                  <label>Category</label>
                  <select value={logCategory} onChange={(e) => setLogCategory(e.target.value)} required>
                    {categories.map(cat => <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Short Note</label>
                  <input
                    type="text"
                    placeholder="e.g. June Rent"
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    maxLength={32}
                  />
                </div>
                <button className="btn primary full" type="submit" disabled={isLogging}>
                  {isLogging ? 'Logging...' : 'Log Payment'}
                </button>
              </form>
            )}

            <div className="insights-section" style={{ marginTop: '30px' }}>
              <h3>Payment Insights</h3>
              <p className="small-text">Total spent per category</p>
              <div className="insights-bars">
                {categories.map(cat => {
                  const val = insights[cat] || 0;
                  const maxVal = Math.max(...Object.values(insights).length ? Object.values(insights) : [1]);
                  const width = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                    <div key={cat} className="insight-row" style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span>{cat.replace('_', ' ')}</span>
                        <span>{val} XLM</span>
                      </div>
                      <div style={{ background: '#eee', height: '10px', borderRadius: '5px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ background: '#007bff', height: '100%', width: `${width}%`, transition: 'width 0.3s ease' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="log-section" style={{ marginTop: '30px' }}>
              <h3>Payment Log</h3>
              <p className="small-text">Your recent categorized payments</p>
              {paymentLogs.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#666' }}>No payments logged yet.</p>
              ) : (
                <div className="log-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {paymentLogs.map((log, index) => {
                    // Extract values properly from scval structure depending on stellar-sdk version
                    // Note: We might need to handle properties gracefully
                    const category = log.category || log[0] || 'Unknown';
                    const amount = Number(log.amount || log[1] || 0) / 10000000;
                    const note = log.note || log[2] || '';
                    const timestamp = Number(log.timestamp || log[3] || 0);
                    const date = timestamp ? new Date(timestamp * 1000).toLocaleString() : 'N/A';
                    
                    return (
                      <div key={index} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ background: '#e9ecef', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{category.toString()}</span>
                          <span style={{ fontWeight: 'bold' }}>{amount} XLM</span>
                        </div>
                        <div style={{ color: '#555', marginBottom: '5px' }}>{note.toString()}</div>
                        <div style={{ color: '#888', fontSize: '12px' }}>{date}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {status && (
          <div className={`status ${statusType}`}>
            {status}
          </div>
        )}
        {txHash && (
          <div className="tx-hash">
            <strong>Transaction Hash:</strong>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
