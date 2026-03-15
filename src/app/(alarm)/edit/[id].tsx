// src/app/(alarm)/edit/[id].tsx

import { useLocalSearchParams } from 'expo-router';

import { CreateScreen } from '@/features/alarm/screens/create-screen';
import { useAlarmStore } from '@/features/alarm/stores/use-alarm-store';

export default function EditAlarmRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alarm = useAlarmStore(s => s.alarms.find(a => a.id === id));

  if (!alarm)
    return null;

  return <CreateScreen initialValues={alarm} />;
}
