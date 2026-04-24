import type { LabAccountItem } from '../../lib/quota-lab-view-model';
import { TONE_COLORS } from './quota-lab-tube-constants';
import { GlassCapsule } from './quota-lab-tube-glass';
import { ConnectorHoses, Hardware } from './quota-lab-tube-hardware';
import {
  LowerLiquid,
  NoDataCore,
  SuspendedParticles,
  UpperReservoir,
} from './quota-lab-tube-liquids';

interface QuotaLabTubeProps {
  item: LabAccountItem;
}

export function QuotaLabTube({ item }: Readonly<QuotaLabTubeProps>) {
  const fiveHourFill = percentToFill(item.fiveHour.percent);
  const weeklyFill = percentToFill(item.weekly.percent);
  const fiveHourColor = TONE_COLORS[item.fiveHour.tone];
  const weeklyColor = TONE_COLORS[item.weekly.tone];
  const shellColor = item.requiresReauth ? TONE_COLORS.reauth : '#dbeafe';
  const hasQuotaData = item.fiveHour.percent !== null || item.weekly.percent !== null;

  return (
    <group>
      <ConnectorHoses toneColor={shellColor} />
      <GlassCapsule shellColor={shellColor} />
      <LowerLiquid fill={fiveHourFill} color={fiveHourColor} />
      <UpperReservoir fill={weeklyFill} color={weeklyColor} />
      <Hardware shellColor={shellColor} requiresReauth={item.requiresReauth} />
      {hasQuotaData ? <SuspendedParticles color={weeklyColor} /> : <NoDataCore />}
    </group>
  );
}

function percentToFill(percent: number | null) {
  if (percent === null) {
    return 0;
  }

  return Math.min(1, Math.max(0, percent / 100));
}
