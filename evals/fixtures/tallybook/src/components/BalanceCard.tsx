export function BalanceCard({ you }: { you: number }) {
  const owed = you >= 0;
  return (
    <section className="card balance">
      <p className="label">your balance</p>
      <p className={owed ? 'amount positive' : 'amount negative'}>
        {owed ? '+' : '−'}${Math.abs(you).toFixed(2)}
      </p>
      <p className="hint">{owed ? 'the flat owes you' : 'you owe the flat'}</p>
      <button className="primary">settle up</button>
    </section>
  );
}
