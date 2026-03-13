import { useEffect, useState, useTransition } from 'react';
import { API_BASE_URL, apiRequest } from './api';

const initialAuthForm = {
  name: '',
  email: '',
  password: '',
};

const initialTransferForm = {
  fromaccount: '',
  toaccount: '',
  amount: '',
};

function App() {
  const [token, setToken] = useState(() => window.localStorage.getItem('ledger-token') || '');
  const [user, setUser] = useState(() => {
    const rawUser = window.localStorage.getItem('ledger-user');
    return rawUser ? JSON.parse(rawUser) : null;
  });
  const [health, setHealth] = useState({ loading: true, data: null, error: '' });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [transferForm, setTransferForm] = useState(initialTransferForm);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let ignore = false;

    async function fetchHealth() {
      try {
        const response = await apiRequest('/health');
        if (!ignore) {
          setHealth({ loading: false, data: response, error: '' });
        }
      } catch (healthError) {
        if (!ignore) {
          setHealth({ loading: false, data: null, error: healthError.message });
        }
      }
    }

    fetchHealth();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (token) {
      window.localStorage.setItem('ledger-token', token);
    } else {
      window.localStorage.removeItem('ledger-token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem('ledger-user', JSON.stringify(user));
    } else {
      window.localStorage.removeItem('ledger-user');
    }
  }, [user]);

  useEffect(() => {
    if (!token) {
      setAccounts([]);
      setTransactions([]);
      return;
    }

    refreshDashboard(token);
  }, [token]);

  async function refreshDashboard(activeToken = token) {
    startTransition(async () => {
      try {
        setError('');
        const [accountsResponse, transactionsResponse] = await Promise.all([
          apiRequest('/api/accounts', { token: activeToken }),
          apiRequest('/api/transactions', { token: activeToken }),
        ]);

        const accountList = accountsResponse.accounts || [];
        const balanceResponses = await Promise.all(
          accountList.map(async (account) => {
            const balanceResponse = await apiRequest(`/api/accounts/balance/${account._id}`, {
              token: activeToken,
            });

            return {
              ...account,
              balance: balanceResponse.balance,
            };
          }),
        );

        setAccounts(balanceResponses);
        setTransactions(transactionsResponse.transactions || []);

        setTransferForm((current) => ({
          ...current,
          fromaccount: current.fromaccount || balanceResponses[0]?._id || '',
          toaccount: current.toaccount || balanceResponses[1]?._id || '',
        }));
      } catch (dashboardError) {
        setError(dashboardError.message);
      }
    });
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setError('');

    const path = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = authMode === 'register'
      ? authForm
      : { email: authForm.email, password: authForm.password };

    startTransition(async () => {
      try {
        const response = await apiRequest(path, {
          method: 'POST',
          body: payload,
        });

        setToken(response.token);
        setUser({ _id: response._id, email: response.email, name: response.name });
        setAuthForm(initialAuthForm);
        setFeedback(authMode === 'register' ? 'Account created and signed in.' : 'Signed in successfully.');
      } catch (authError) {
        setError(authError.message);
      }
    });
  }

  async function handleLogout() {
    startTransition(async () => {
      try {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
          token,
        });
      } catch (logoutError) {
        setError(logoutError.message);
      } finally {
        setToken('');
        setUser(null);
        setAccounts([]);
        setTransactions([]);
        setFeedback('Signed out.');
      }
    });
  }

  async function handleCreateAccount() {
    setFeedback('');
    setError('');

    startTransition(async () => {
      try {
        await apiRequest('/api/accounts', {
          method: 'POST',
          token,
        });
        setFeedback('New account created.');
        await refreshDashboard();
      } catch (accountError) {
        setError(accountError.message);
      }
    });
  }

  async function handleTransferSubmit(event) {
    event.preventDefault();
    setFeedback('');
    setError('');

    const idempotencyKey = `web-${Date.now()}`;

    startTransition(async () => {
      try {
        await apiRequest('/api/transactions', {
          method: 'POST',
          token,
          body: {
            ...transferForm,
            amount: Number(transferForm.amount),
            idempotencyKey,
          },
        });

        setFeedback('Transfer completed successfully.');
        setTransferForm((current) => ({
          ...current,
          amount: '',
        }));
        await refreshDashboard();
      } catch (transactionError) {
        setError(transactionError.message);
      }
    });
  }

  const canTransfer = accounts.length >= 2;

  return (
    <div className="page-shell">
      <header className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Ledger platform demo</p>
          <h1>Backend Ledger, organized as a clean full-stack resume project.</h1>
          <p className="hero-text">
            The backend now lives in a dedicated server workspace, and this React frontend surfaces
            the real API flows recruiters care about: authentication, account creation, balances,
            and idempotent transfers.
          </p>
          <div className="hero-badges">
            <span>Node + Express</span>
            <span>MongoDB + Mongoose</span>
            <span>React + Vite</span>
          </div>
        </div>
        <div className="status-card">
          <h2>Environment</h2>
          <dl>
            <div>
              <dt>Frontend URL</dt>
              <dd>http://localhost:5173</dd>
            </div>
            <div>
              <dt>API Base URL</dt>
              <dd>{API_BASE_URL}</dd>
            </div>
            <div>
              <dt>Backend health</dt>
              <dd>
                {health.loading && 'Checking...'}
                {!health.loading && health.data && health.data.status}
                {!health.loading && health.error && `Unavailable: ${health.error}`}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel auth-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Authentication</p>
              <h2>{user ? `Welcome, ${user.name}` : 'Sign in to the live backend'}</h2>
            </div>
            {user ? (
              <button className="ghost-button" onClick={handleLogout} disabled={isPending}>
                Logout
              </button>
            ) : null}
          </div>

          {!user ? (
            <>
              <div className="tab-row">
                <button
                  className={authMode === 'login' ? 'tab active' : 'tab'}
                  onClick={() => setAuthMode('login')}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={authMode === 'register' ? 'tab active' : 'tab'}
                  onClick={() => setAuthMode('register')}
                  type="button"
                >
                  Register
                </button>
              </div>
              <form className="stack" onSubmit={handleAuthSubmit}>
                {authMode === 'register' ? (
                  <label>
                    <span>Name</span>
                    <input
                      value={authForm.name}
                      onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                      placeholder="Aarav Sharma"
                      required
                    />
                  </label>
                ) : null}
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                </label>
                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                  />
                </label>
                <button className="primary-button" disabled={isPending} type="submit">
                  {isPending ? 'Working...' : authMode === 'register' ? 'Create account' : 'Login'}
                </button>
              </form>
            </>
          ) : (
            <div className="signed-in-card">
              <p>
                Logged in as <strong>{user.email}</strong>
              </p>
              <p>
                Your token is stored locally so you can refresh the page and keep demonstrating the
                system during interviews.
              </p>
              <button className="secondary-button" disabled={isPending} onClick={() => refreshDashboard()}>
                Refresh dashboard
              </button>
            </div>
          )}

          {feedback ? <p className="feedback success">{feedback}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}
        </section>

        <section className="panel workflow-panel">
          <p className="eyebrow">How it works</p>
          <h2>Simple product story for your resume walkthrough.</h2>
          <ol className="workflow-list">
            <li>Create or log in to a user profile through the Express auth APIs.</li>
            <li>Provision one or more accounts tied to that user through protected account routes.</li>
            <li>Read balance snapshots derived from immutable ledger entries.</li>
            <li>Trigger transfers with unique idempotency keys and inspect the resulting history.</li>
          </ol>
        </section>

        <section className="panel accounts-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Accounts</p>
              <h2>Owned accounts and balances</h2>
            </div>
            <button className="primary-button" disabled={!user || isPending} onClick={handleCreateAccount}>
              Create account
            </button>
          </div>
          <div className="account-grid">
            {accounts.length === 0 ? (
              <div className="empty-state">Sign in and create an account to see balance data.</div>
            ) : (
              accounts.map((account, index) => (
                <article className="account-card" key={account._id}>
                  <p className="account-index">Account {index + 1}</p>
                  <h3>{account.currency} wallet</h3>
                  <p className="balance-value">{Number(account.balance || 0).toLocaleString('en-IN')}</p>
                  <div className="account-meta">
                    <span>{account.accountType}</span>
                    <span>{account._id.slice(-6)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel transfer-panel">
          <p className="eyebrow">Transfers</p>
          <h2>Run a transaction against the live backend.</h2>
          <form className="stack" onSubmit={handleTransferSubmit}>
            <label>
              <span>From account</span>
              <select
                value={transferForm.fromaccount}
                onChange={(event) => setTransferForm({ ...transferForm, fromaccount: event.target.value })}
                disabled={!user || !canTransfer}
                required
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account._id.slice(-6)} · balance {Number(account.balance || 0).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>To account</span>
              <select
                value={transferForm.toaccount}
                onChange={(event) => setTransferForm({ ...transferForm, toaccount: event.target.value })}
                disabled={!user || !canTransfer}
                required
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account._id.slice(-6)} · {account.accountType}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Amount</span>
              <input
                type="number"
                min="1"
                step="1"
                value={transferForm.amount}
                onChange={(event) => setTransferForm({ ...transferForm, amount: event.target.value })}
                placeholder="500"
                disabled={!user || !canTransfer}
                required
              />
            </label>
            <button className="primary-button" disabled={!user || !canTransfer || isPending} type="submit">
              {isPending ? 'Processing...' : 'Transfer funds'}
            </button>
            {!canTransfer && user ? (
              <p className="hint">Create at least two accounts to demonstrate a transfer.</p>
            ) : null}
          </form>
        </section>

        <section className="panel transactions-panel">
          <p className="eyebrow">Recent activity</p>
          <h2>Latest transactions</h2>
          <div className="transaction-list">
            {transactions.length === 0 ? (
              <div className="empty-state">No transactions yet.</div>
            ) : (
              transactions.map((transaction) => (
                <article className="transaction-row" key={transaction._id}>
                  <div>
                    <p className="transaction-status">{transaction.status}</p>
                    <h3>
                      {transaction.fromaccount?._id?.slice(-6) || '------'} to {transaction.toaccount?._id?.slice(-6) || '------'}
                    </h3>
                  </div>
                  <div className="transaction-meta">
                    <span>{Number(transaction.amount).toLocaleString('en-IN')}</span>
                    <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
