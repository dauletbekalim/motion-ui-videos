// The "add expense" sheet: amount keypad, who paid (avatars), split toggle (even / shares), save.
export function AddExpense() {
  return (
    <div className="sheet">
      <p className="label">add expense</p>
      <p className="amount-input">$0.00</p>
      <div className="payers">{['You', 'Maya', 'Jonas', 'Ade'].map((p) => <span key={p} className="avatar">{p[0]}</span>)}</div>
      <div className="toggle"><button className="on">split evenly</button><button>by share</button></div>
      <button className="primary">save</button>
    </div>
  );
}
