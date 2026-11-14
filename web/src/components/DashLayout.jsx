import { useDash } from "../state/DashContext.jsx";
import Timeline from "./Timeline.jsx";
export const PAGES = {
  dashboard: "نظرة عامة",
  departments: "الأقسام",
  simulation: "المحاكاة والقرارات",
  ambulances: "الإسعاف والتحويل",
  patients: "المرضى",
};
export default function DashLayout({ page, go, children }) {
  const { Dv, clock, setClock, playing, setPlaying, reset, sB } = useDash();
  return (
    <div className="db">
      <div className="wrap">
        <h1 className="dh">
          شبكة التوأم الرقمي الذكية — مركز القيادة{" "}
          <span>حياة | HAYAH · رصد ← تنبؤ ← محاكاة ← توصية ← قرار بشري</span>
        </h1>
        <div className="subnav">
          {Object.entries(PAGES).map(([k, v]) => (
            <button key={k} aria-pressed={k === page} onClick={() => go(k)}>
              {v}
            </button>
          ))}
        </div>
        <Timeline
          D={Dv}
          clock={clock}
          setClock={setClock}
          playing={playing}
          setPlaying={setPlaying}
          onReset={reset}
          sB={sB}
        />
        {children}
        <footer>
          التوقع التشغيلي لا يساوي القرار السريري: الذكاء الاصطناعي يحلل ويتنبأ،
          والمحاكاة تختبر، والإنسان يقرر. · كل البيانات والنتائج
          اصطناعية/محاكاة.
        </footer>
      </div>
    </div>
  );
}
