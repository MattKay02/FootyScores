import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colours } from '../constants/colours';
import LiveIndicator from './LiveIndicator';

const LIVE_STATUSES = ['1H', '2H', 'ET'];
const SCORE_STATUSES = ['1H', 'HT', '2H', 'ET', 'FT'];

function teamInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function CrestImage({ uri, teamName }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={styles.crestFallback}>
        <Text style={styles.crestInitials}>{teamInitials(teamName)}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.crest}
      contentFit="contain"
      onError={() => setFailed(true)}
    />
  );
}

function ScoreDisplay({ fixture }) {
  const { statusShort, score, time } = fixture;

  if (statusShort === 'NS') {
    return <Text style={styles.kickoffTime}>{time}</Text>;
  }

  if (statusShort === 'PST') {
    return <Text style={styles.mutedStatus}>PST</Text>;
  }

  if (statusShort === 'CANC') {
    return <Text style={styles.mutedStatus}>CANC</Text>;
  }

  if (SCORE_STATUSES.includes(statusShort)) {
    const isLive = LIVE_STATUSES.includes(statusShort);
    const isHalfTime = statusShort === 'HT';

    return (
      <View style={styles.scoreWrapper}>
        <View style={styles.scoreRow}>
          {isLive && (
            <View style={styles.liveIndicatorWrapper}>
              <LiveIndicator />
            </View>
          )}
          <Text style={styles.scoreText}>
            {score.home} – {score.away}
          </Text>
        </View>
        {isHalfTime && <Text style={styles.htLabel}>HT</Text>}
      </View>
    );
  }

  return null;
}

export default function FixtureCard({ fixture }) {
  const { homeTeam, awayTeam } = fixture;

  return (
    <View style={styles.card}>
      <View style={styles.teamSide}>
        <CrestImage uri={homeTeam.crest} teamName={homeTeam.name} />
        <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
          {homeTeam.name}
        </Text>
      </View>

      <View style={styles.centreSection}>
        <ScoreDisplay fixture={fixture} />
      </View>

      <View style={styles.teamSideRight}>
        <Text style={styles.teamNameRight} numberOfLines={1} ellipsizeMode="tail">
          {awayTeam.name}
        </Text>
        <CrestImage uri={awayTeam.crest} teamName={awayTeam.name} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.surface,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  teamSide: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  teamSideRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    color: colours.textPrimary,
    textAlign: 'right',
  },
  teamNameRight: {
    flex: 1,
    fontSize: 14,
    color: colours.textPrimary,
    textAlign: 'left',
  },
  centreSection: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  scoreWrapper: {
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicatorWrapper: {
    marginRight: 2,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: colours.scoreText,
  },
  htLabel: {
    fontSize: 10,
    color: colours.textSecondary,
    marginTop: 2,
  },
  kickoffTime: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  mutedStatus: {
    fontSize: 13,
    color: colours.textMuted,
    fontWeight: '500',
  },
  crest: {
    width: 28,
    height: 28,
  },
  crestFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colours.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestInitials: {
    fontSize: 8,
    color: colours.textSecondary,
    fontWeight: '600',
  },
});
