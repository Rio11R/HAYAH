export default ({ log }) => (
  <section className="card">
    <h2>
      سجل القرارات <small>تتبّع الاستخدام</small>
    </h2>
    <ul className="dlog">
      {log.length ? (
        log.map((l, i) => (
          <li key={i}>
            <b>{l.time}</b> — اعتُمد: {l.text} (T+{l.t} د)
          </li>
        ))
      ) : (
        <li>لا قرارات بعد.</li>
      )}
    </ul>
  </section>
);
