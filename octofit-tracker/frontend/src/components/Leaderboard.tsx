import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      path="/api/leaderboard"
      emptyMessage="No leaderboard entries"
      mapItems={(payload: { leaderboard?: LeaderboardEntry[] }) => payload.leaderboard ?? []}
      renderItem={(item) => {
        const entry = item as LeaderboardEntry;
        return (
          <div>
            <strong>{entry.teamName ?? 'Team'}</strong>
            <div className="text-muted">{entry.totalPoints ?? 0} points · rank {entry.rank ?? 'n/a'}</div>
          </div>
        );
      }}
    />
  );
}
