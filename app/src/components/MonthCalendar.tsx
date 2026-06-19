import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius } from '@/theme';
import { getMonthGrid, HEBREW_DAY_LETTERS } from '@/utils/calendar';

interface MonthCalendarProps {
  month: string;
  markedDates?: Record<string, 'filled' | 'draft'>;
}

export function MonthCalendar({ month, markedDates = {} }: MonthCalendarProps) {
  const cells = getMonthGrid(month);

  return (
    <View>
      <View style={styles.row}>
        {HEBREW_DAY_LETTERS.map((d) => (
          <AppText key={d} variant="micro" style={styles.dayLetter}>
            {d}
          </AppText>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          const mark = cell.date ? markedDates[cell.date] : undefined;
          return (
            <View key={i} style={styles.cell}>
              {cell.day ? (
                <>
                  <AppText variant="micro" style={styles.dayNumber}>
                    {cell.day}
                  </AppText>
                  {mark ? (
                    <View
                      style={[
                        styles.marker,
                        mark === 'draft' ? styles.markerDraft : styles.markerFilled,
                      ]}
                    />
                  ) : null}
                </>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_PCT = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  dayLetter: { width: CELL_PCT, textAlign: 'center', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cell: {
    width: CELL_PCT,
    height: 36,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 3,
  },
  dayNumber: { color: colors.textFaint },
  marker: {
    position: 'absolute',
    left: 3,
    right: 3,
    bottom: 3,
    height: 6,
    borderRadius: 2,
  },
  markerFilled: { backgroundColor: colors.ink },
  markerDraft: { backgroundColor: colors.amber },
});
