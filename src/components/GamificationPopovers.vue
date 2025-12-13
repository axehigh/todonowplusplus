<template>
  <!-- Gamification info popovers -->
  <ion-popover
    v-if="isAuthenticated && funMode"
    trigger="btnStreakInfo"
    trigger-action="click"
  >
    <ion-content class="ion-padding">
      <ion-text>
        <h3>Streak</h3>
        <p>
          Your streak is the number of consecutive days you've completed at least one task.
          Keep going to build a longer streak!
        </p>
        <p><strong>Current streak:</strong> {{ streak }} day<span v-if="streak !== 1">s</span></p>
      </ion-text>
    </ion-content>
  </ion-popover>

  <ion-popover
    v-if="isAuthenticated && funMode"
    trigger="btnPointsInfo"
    trigger-action="click"
  >
    <ion-content class="ion-padding">
      <ion-text>
        <h3>Points</h3>
        <p>
          You earn points by completing tasks. Each completion gives points, with
          small bonuses for staying productive.
        </p>
        <p><strong>Total points:</strong> {{ points }}</p>
      </ion-text>
    </ion-content>
  </ion-popover>
</template>

<script setup lang="ts">
import { IonPopover, IonContent, IonText } from '@ionic/vue';

defineProps<{
  isAuthenticated: boolean;
  funMode: boolean;
  streak: number;
  points: number;
}>();
</script>
