const EXPENSES = [
  { who: 'Maya', what: 'Groceries', amount: 64.2, split: 'even', when: 'today' },
  { who: 'Jonas', what: 'Internet (Oct)', amount: 39.99, split: 'even', when: 'yesterday' },
  { who: 'You', what: 'Cleaning supplies', amount: 18.5, split: 'even', when: 'Mon' },
  { who: 'Ade', what: 'Pizza night', amount: 42.0, split: 'shares', when: 'Sun' },
];
export function ExpenseList() {
  return (
    <ul className="list">
      {EXPENSES.map((e) => (
        <li key={e.what} className="row">
          <span className="avatar">{e.who[0]}</span>
          <span className="what">{e.what}<small>{e.who} paid · {e.when}</small></span>
          <span className="num">${e.amount.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}
