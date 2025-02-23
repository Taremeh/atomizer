import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function PoliticianPage() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          🛠️
          <span className="ml-2">
            { "Atomizer Persist (MD)" }
          </span>
        </li>
        <li>
          🛠️
          <span className="ml-2">
            {"Persist MD > convert/md2json > reduceJsonToContext > persistContext"}
          </span>
        </li>
        <li className="hidden text-l md:block">
          🎨
          <span className="ml-2">
            The main frontend logic is found in <code>app/persist/page.tsx</code>
            .
          </span>
        </li>
        <li className="text-l">
          👇
          <span className="ml-2">
            Try to decompose a note into it's Atoms and Contexts e.g. <code>XXX?</code> below!
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <ChatWindow
      endpoint="api/atomizer/persist/politician"
      emptyStateComponent={InfoCard}
      placeholder="Insert a Politician!"
      emoji="🦜"
      showIntermediateStepsToggle={true}
    />
  );
}
