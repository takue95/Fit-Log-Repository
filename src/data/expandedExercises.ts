import { Exercise, EquipmentType, MuscleGroup } from '../types/fitness';

type Movement = 'press' | 'fly' | 'row' | 'pulldown' | 'squat' | 'hinge' | 'raise' | 'curl' | 'triceps' | 'calf' | 'core' | 'glute' | 'carry';

interface ExerciseSeed {
  id: string;
  name: string;
  category: MuscleGroup;
  equipment: EquipmentType;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  movement: Movement;
  rest: number;
}

const movementCues: Record<Movement, { setup: string; action: string; return: string; tip: string }> = {
  press: {
    setup: 'Set a stable stance or bench position and bring the handles or bar to the start position.',
    action: 'Brace, then press smoothly along a comfortable path until your arms are extended.',
    return: 'Lower the resistance under control and keep your shoulders settled.',
    tip: 'Use a load that lets you keep the same controlled path on every rep.'
  },
  fly: {
    setup: 'Set the bench or cable position so the resistance lines up with your chest.',
    action: 'Keep a soft bend in your elbows and bring your hands together in a broad arc.',
    return: 'Open your arms slowly until you feel a comfortable stretch, without letting the shoulders roll forward.',
    tip: 'Keep the elbow angle steady; make the movement come from the shoulders.'
  },
  row: {
    setup: 'Brace your torso and let your arms reach forward without rounding your lower back.',
    action: 'Pull your elbows toward your hips or ribs and pause briefly at the top.',
    return: 'Extend your arms slowly while keeping your trunk steady.',
    tip: 'Avoid using momentum to move the load.'
  },
  pulldown: {
    setup: 'Take a secure grip and set your torso tall with your ribs stacked over your hips.',
    action: 'Drive your elbows down as you pull the bar or your body toward the start point.',
    return: 'Let your arms lengthen under control without shrugging or swinging.',
    tip: 'Think elbows down; keep the torso motion small.'
  },
  squat: {
    setup: 'Set your feet in a comfortable stance and brace your trunk before each rep.',
    action: 'Bend at the hips and knees, lowering only as far as you can stay balanced.',
    return: 'Drive through the whole foot to stand, keeping your knees in line with your toes.',
    tip: 'Use a depth and stance that feel stable for your body.'
  },
  hinge: {
    setup: 'Stand tall, soften your knees and brace before moving the load.',
    action: 'Push your hips back while keeping the weight close and your spine neutral.',
    return: 'Drive your hips forward to stand tall without leaning back at the top.',
    tip: 'End the range when your hamstrings limit the hinge; do not chase the floor.'
  },
  raise: {
    setup: 'Stand or sit tall with a light bend in your elbows and a relaxed grip.',
    action: 'Lift the resistance smoothly in the direction of the target muscle.',
    return: 'Lower slowly and keep your torso still throughout the rep.',
    tip: 'Choose a light enough weight to avoid swinging.'
  },
  curl: {
    setup: 'Set your upper arms or wrists in a stable position and keep your torso still.',
    action: 'Bend your elbows to curl the resistance without rocking your body.',
    return: 'Lower until your arms are comfortably extended, keeping tension on the target muscles.',
    tip: 'If you need momentum, reduce the load.'
  },
  triceps: {
    setup: 'Set your shoulders comfortably and keep your upper arms close to a fixed position.',
    action: 'Straighten your elbows to move the resistance through its full comfortable range.',
    return: 'Bend your elbows slowly without letting them drift excessively.',
    tip: 'Keep the upper arm quiet so the elbow does the work.'
  },
  calf: {
    setup: 'Place the balls of your feet on the platform and hold a stable support.',
    action: 'Rise onto your toes and pause briefly at the top.',
    return: 'Lower your heels slowly into a comfortable stretch before the next rep.',
    tip: 'Use a full, controlled range instead of bouncing.'
  },
  core: {
    setup: 'Set a stable position and brace your abdomen before starting the rep.',
    action: 'Move through the trunk or hips while keeping your lower back controlled.',
    return: 'Come back slowly and reset your brace before the next rep.',
    tip: 'Stop the set if you cannot keep your trunk controlled.'
  },
  glute: {
    setup: 'Set your feet and hips securely and brace before moving.',
    action: 'Drive through your heels and extend your hips, squeezing your glutes at the top.',
    return: 'Lower your hips under control without losing your setup.',
    tip: 'Finish with the hips extended; avoid arching your lower back.'
  },
  carry: {
    setup: 'Pick up the load with a braced trunk and shoulders level.',
    action: 'Walk with short, steady steps while keeping the weight close and your torso upright.',
    return: 'Set the load down carefully after the planned distance or time.',
    tip: 'Use a clear path and stop before your grip or posture breaks down.'
  }
};

const seeds: ExerciseSeed[] = [
  // Chest
  { id: 'barbell-incline-bench-press', name: 'Barbell Incline Bench Press', category: 'Chest', equipment: 'Barbell', primaryMuscles: ['Upper Chest'], secondaryMuscles: ['Anterior Deltoids', 'Triceps'], movement: 'press', rest: 120 },
  { id: 'decline-barbell-bench-press', name: 'Decline Barbell Bench Press', category: 'Chest', equipment: 'Barbell', primaryMuscles: ['Lower Pectorals'], secondaryMuscles: ['Triceps', 'Anterior Deltoids'], movement: 'press', rest: 120 },
  { id: 'decline-dumbbell-press', name: 'Decline Dumbbell Press', category: 'Chest', equipment: 'Dumbbell', primaryMuscles: ['Lower Pectorals'], secondaryMuscles: ['Triceps'], movement: 'press', rest: 90 },
  { id: 'smith-machine-bench-press', name: 'Smith Machine Bench Press', category: 'Chest', equipment: 'Smith Machine', primaryMuscles: ['Pectoralis Major'], secondaryMuscles: ['Triceps', 'Anterior Deltoids'], movement: 'press', rest: 120 },
  { id: 'incline-smith-machine-press', name: 'Incline Smith Machine Press', category: 'Chest', equipment: 'Smith Machine', primaryMuscles: ['Upper Chest'], secondaryMuscles: ['Anterior Deltoids', 'Triceps'], movement: 'press', rest: 120 },
  { id: 'machine-chest-press', name: 'Machine Chest Press', category: 'Chest', equipment: 'Machine', primaryMuscles: ['Pectoralis Major'], secondaryMuscles: ['Triceps', 'Anterior Deltoids'], movement: 'press', rest: 90 },
  { id: 'incline-machine-chest-press', name: 'Incline Machine Chest Press', category: 'Chest', equipment: 'Machine', primaryMuscles: ['Upper Chest'], secondaryMuscles: ['Anterior Deltoids', 'Triceps'], movement: 'press', rest: 90 },
  { id: 'pec-deck-fly', name: 'Pec Deck Fly', category: 'Chest', equipment: 'Machine', primaryMuscles: ['Pectoralis Major'], secondaryMuscles: ['Anterior Deltoids'], movement: 'fly', rest: 60 },
  { id: 'low-to-high-cable-fly', name: 'Low-to-High Cable Fly', category: 'Chest', equipment: 'Cable', primaryMuscles: ['Upper Chest'], secondaryMuscles: ['Anterior Deltoids'], movement: 'fly', rest: 60 },
  { id: 'high-to-low-cable-fly', name: 'High-to-Low Cable Fly', category: 'Chest', equipment: 'Cable', primaryMuscles: ['Lower Pectorals'], secondaryMuscles: ['Anterior Deltoids'], movement: 'fly', rest: 60 },
  { id: 'push-up', name: 'Push-Up', category: 'Chest', equipment: 'Bodyweight', primaryMuscles: ['Pectoralis Major'], secondaryMuscles: ['Triceps', 'Core'], movement: 'press', rest: 60 },
  { id: 'weighted-push-up', name: 'Weighted Push-Up', category: 'Chest', equipment: 'Bodyweight', primaryMuscles: ['Pectoralis Major'], secondaryMuscles: ['Triceps', 'Core'], movement: 'press', rest: 90 },
  { id: 'dumbbell-pullover', name: 'Dumbbell Pullover', category: 'Chest', equipment: 'Dumbbell', primaryMuscles: ['Chest'], secondaryMuscles: ['Lats', 'Serratus'], movement: 'pulldown', rest: 75 },

  // Back
  { id: 'machine-lat-pulldown', name: 'Machine Lat Pulldown', category: 'Back', equipment: 'Machine', primaryMuscles: ['Latissimus Dorsi'], secondaryMuscles: ['Biceps', 'Rhomboids'], movement: 'pulldown', rest: 90 },
  { id: 'leverage-machine-iso-row', name: 'Leverage Machine Iso Row', category: 'Back', equipment: 'Machine', primaryMuscles: ['Mid Back', 'Latissimus Dorsi'], secondaryMuscles: ['Rear Deltoids', 'Biceps'], movement: 'row', rest: 90 },
  { id: 'pull-up', name: 'Pull-Up', category: 'Back', equipment: 'Bodyweight', primaryMuscles: ['Latissimus Dorsi'], secondaryMuscles: ['Biceps', 'Upper Back'], movement: 'pulldown', rest: 120 },
  { id: 'neutral-grip-lat-pulldown', name: 'Neutral-Grip Lat Pulldown', category: 'Back', equipment: 'Cable', primaryMuscles: ['Latissimus Dorsi'], secondaryMuscles: ['Biceps', 'Rhomboids'], movement: 'pulldown', rest: 90 },
  { id: 'close-grip-lat-pulldown', name: 'Close-Grip Lat Pulldown', category: 'Back', equipment: 'Cable', primaryMuscles: ['Latissimus Dorsi'], secondaryMuscles: ['Biceps'], movement: 'pulldown', rest: 90 },
  { id: 'reverse-grip-lat-pulldown', name: 'Reverse-Grip Lat Pulldown', category: 'Back', equipment: 'Cable', primaryMuscles: ['Latissimus Dorsi'], secondaryMuscles: ['Biceps'], movement: 'pulldown', rest: 90 },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Cable Pulldown', category: 'Back', equipment: 'Cable', primaryMuscles: ['Latissimus Dorsi'], secondaryMuscles: ['Teres Major', 'Triceps Long Head'], movement: 'pulldown', rest: 60 },
  { id: 'chest-supported-tbar-row', name: 'Chest-Supported T-Bar Row', category: 'Back', equipment: 'Machine', primaryMuscles: ['Mid Back'], secondaryMuscles: ['Lats', 'Rear Deltoids', 'Biceps'], movement: 'row', rest: 90 },
  { id: 'chest-supported-dumbbell-row', name: 'Chest-Supported Dumbbell Row', category: 'Back', equipment: 'Dumbbell', primaryMuscles: ['Mid Back'], secondaryMuscles: ['Lats', 'Biceps'], movement: 'row', rest: 90 },
  { id: 'wide-grip-seated-cable-row', name: 'Wide-Grip Seated Cable Row', category: 'Back', equipment: 'Cable', primaryMuscles: ['Rhomboids', 'Mid Trapezius'], secondaryMuscles: ['Lats', 'Rear Deltoids'], movement: 'row', rest: 90 },
  { id: 'single-arm-cable-row', name: 'Single-Arm Cable Row', category: 'Back', equipment: 'Cable', primaryMuscles: ['Latissimus Dorsi'], secondaryMuscles: ['Rhomboids', 'Biceps'], movement: 'row', rest: 75 },
  { id: 'one-arm-dumbbell-row', name: 'One-Arm Dumbbell Row', category: 'Back', equipment: 'Dumbbell', primaryMuscles: ['Latissimus Dorsi'], secondaryMuscles: ['Rhomboids', 'Biceps'], movement: 'row', rest: 90 },
  { id: 'machine-high-row', name: 'Machine High Row', category: 'Back', equipment: 'Machine', primaryMuscles: ['Upper Back'], secondaryMuscles: ['Lats', 'Biceps'], movement: 'row', rest: 90 },
  { id: 'reverse-grip-barbell-row', name: 'Reverse-Grip Barbell Row', category: 'Back', equipment: 'Barbell', primaryMuscles: ['Mid Back'], secondaryMuscles: ['Lats', 'Biceps'], movement: 'row', rest: 120 },
  { id: 'rack-pull', name: 'Rack Pull', category: 'Back', equipment: 'Barbell', primaryMuscles: ['Erector Spinae', 'Trapezius'], secondaryMuscles: ['Glutes', 'Hamstrings'], movement: 'hinge', rest: 150 },
  { id: 'trap-bar-deadlift', name: 'Trap Bar Deadlift', category: 'Back', equipment: 'Trap Bar', primaryMuscles: ['Glutes', 'Quadriceps', 'Erector Spinae'], secondaryMuscles: ['Hamstrings', 'Trapezius'], movement: 'hinge', rest: 150 },
  { id: 'back-extension', name: 'Back Extension', category: 'Back', equipment: 'Machine', primaryMuscles: ['Erector Spinae'], secondaryMuscles: ['Glutes', 'Hamstrings'], movement: 'hinge', rest: 75 },
  { id: 'dumbbell-shrug', name: 'Dumbbell Shrug', category: 'Back', equipment: 'Dumbbell', primaryMuscles: ['Upper Trapezius'], secondaryMuscles: ['Forearms'], movement: 'raise', rest: 60 },

  // Shoulders
  { id: 'leverage-machine-shrug', name: 'Leverage Machine Shrug', category: 'Shoulders', equipment: 'Machine', primaryMuscles: ['Upper Trapezius'], secondaryMuscles: ['Forearms'], movement: 'raise', rest: 60 },
  { id: 'seated-dumbbell-shoulder-press', name: 'Seated Dumbbell Shoulder Press', category: 'Shoulders', equipment: 'Dumbbell', primaryMuscles: ['Anterior Deltoids'], secondaryMuscles: ['Lateral Deltoids', 'Triceps'], movement: 'press', rest: 90 },
  { id: 'arnold-press', name: 'Arnold Press', category: 'Shoulders', equipment: 'Dumbbell', primaryMuscles: ['Anterior Deltoids'], secondaryMuscles: ['Lateral Deltoids', 'Triceps'], movement: 'press', rest: 90 },
  { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', category: 'Shoulders', equipment: 'Machine', primaryMuscles: ['Anterior Deltoids'], secondaryMuscles: ['Lateral Deltoids', 'Triceps'], movement: 'press', rest: 90 },
  { id: 'smith-machine-shoulder-press', name: 'Smith Machine Shoulder Press', category: 'Shoulders', equipment: 'Smith Machine', primaryMuscles: ['Anterior Deltoids'], secondaryMuscles: ['Triceps'], movement: 'press', rest: 90 },
  { id: 'single-arm-cable-lateral-raise', name: 'Single-Arm Cable Lateral Raise', category: 'Shoulders', equipment: 'Cable', primaryMuscles: ['Lateral Deltoids'], secondaryMuscles: ['Supraspinatus'], movement: 'raise', rest: 60 },
  { id: 'lean-away-cable-lateral-raise', name: 'Lean-Away Cable Lateral Raise', category: 'Shoulders', equipment: 'Cable', primaryMuscles: ['Lateral Deltoids'], secondaryMuscles: ['Supraspinatus'], movement: 'raise', rest: 60 },
  { id: 'machine-lateral-raise', name: 'Machine Lateral Raise', category: 'Shoulders', equipment: 'Machine', primaryMuscles: ['Lateral Deltoids'], secondaryMuscles: ['Supraspinatus'], movement: 'raise', rest: 60 },
  { id: 'cable-rear-delt-fly', name: 'Cable Rear Delt Fly', category: 'Shoulders', equipment: 'Cable', primaryMuscles: ['Posterior Deltoids'], secondaryMuscles: ['Rhomboids', 'Trapezius'], movement: 'fly', rest: 60 },
  { id: 'reverse-pec-deck', name: 'Reverse Pec Deck', category: 'Shoulders', equipment: 'Machine', primaryMuscles: ['Posterior Deltoids'], secondaryMuscles: ['Rhomboids', 'Trapezius'], movement: 'fly', rest: 60 },
  { id: 'dumbbell-front-raise', name: 'Dumbbell Front Raise', category: 'Shoulders', equipment: 'Dumbbell', primaryMuscles: ['Anterior Deltoids'], secondaryMuscles: ['Upper Chest'], movement: 'raise', rest: 60 },
  { id: 'cable-upright-row', name: 'Cable Upright Row', category: 'Shoulders', equipment: 'Cable', primaryMuscles: ['Lateral Deltoids', 'Trapezius'], secondaryMuscles: ['Biceps'], movement: 'row', rest: 60 },
  { id: 'barbell-shrug', name: 'Barbell Shrug', category: 'Shoulders', equipment: 'Barbell', primaryMuscles: ['Upper Trapezius'], secondaryMuscles: ['Forearms'], movement: 'raise', rest: 75 },

  // Quads
  { id: 'front-squat', name: 'Front Squat', category: 'Quads', equipment: 'Barbell', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes', 'Core'], movement: 'squat', rest: 150 },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'Quads', equipment: 'Dumbbell', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes', 'Core'], movement: 'squat', rest: 90 },
  { id: 'smith-machine-squat', name: 'Smith Machine Squat', category: 'Quads', equipment: 'Smith Machine', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes'], movement: 'squat', rest: 120 },
  { id: 'hack-squat', name: 'Hack Squat', category: 'Quads', equipment: 'Machine', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes'], movement: 'squat', rest: 120 },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Quads', equipment: 'Dumbbell', primaryMuscles: ['Quadriceps', 'Glutes'], secondaryMuscles: ['Hamstrings', 'Core'], movement: 'squat', rest: 90 },
  { id: 'dumbbell-walking-lunge', name: 'Dumbbell Walking Lunge', category: 'Quads', equipment: 'Dumbbell', primaryMuscles: ['Quadriceps', 'Glutes'], secondaryMuscles: ['Hamstrings', 'Core'], movement: 'squat', rest: 90 },
  { id: 'dumbbell-step-up', name: 'Dumbbell Step-Up', category: 'Quads', equipment: 'Dumbbell', primaryMuscles: ['Quadriceps', 'Glutes'], secondaryMuscles: ['Hamstrings'], movement: 'squat', rest: 75 },
  { id: 'single-leg-leg-extension', name: 'Single-Leg Leg Extension', category: 'Quads', equipment: 'Machine', primaryMuscles: ['Quadriceps'], movement: 'raise', rest: 60 },
  { id: 'sissy-squat', name: 'Sissy Squat', category: 'Quads', equipment: 'Bodyweight', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Core'], movement: 'squat', rest: 75 },

  // Hamstrings
  { id: 'barbell-stiff-leg-deadlift', name: 'Barbell Stiff-Leg Deadlift', category: 'Hamstrings', equipment: 'Barbell', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Erector Spinae'], movement: 'hinge', rest: 120 },
  { id: 'dumbbell-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', category: 'Hamstrings', equipment: 'Dumbbell', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Erector Spinae'], movement: 'hinge', rest: 120 },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Hamstrings', equipment: 'Machine', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Gastrocnemius'], movement: 'curl', rest: 75 },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', category: 'Hamstrings', equipment: 'Machine', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Gastrocnemius'], movement: 'curl', rest: 75 },
  { id: 'single-leg-dumbbell-rdl', name: 'Single-Leg Dumbbell Romanian Deadlift', category: 'Hamstrings', equipment: 'Dumbbell', primaryMuscles: ['Hamstrings', 'Glutes'], secondaryMuscles: ['Core'], movement: 'hinge', rest: 90 },
  { id: 'nordic-hamstring-curl', name: 'Nordic Hamstring Curl', category: 'Hamstrings', equipment: 'Bodyweight', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes'], movement: 'curl', rest: 120 },
  { id: 'barbell-good-morning', name: 'Barbell Good Morning', category: 'Hamstrings', equipment: 'Barbell', primaryMuscles: ['Hamstrings', 'Erector Spinae'], secondaryMuscles: ['Glutes'], movement: 'hinge', rest: 120 },
  { id: 'glute-ham-raise', name: 'Glute-Ham Raise', category: 'Hamstrings', equipment: 'Machine', primaryMuscles: ['Hamstrings'], secondaryMuscles: ['Glutes', 'Calves'], movement: 'curl', rest: 90 },

  // Glutes
  { id: 'barbell-hip-thrust', name: 'Barbell Hip Thrust', category: 'Glutes', equipment: 'Barbell', primaryMuscles: ['Gluteus Maximus'], secondaryMuscles: ['Hamstrings'], movement: 'glute', rest: 120 },
  { id: 'smith-machine-hip-thrust', name: 'Smith Machine Hip Thrust', category: 'Glutes', equipment: 'Smith Machine', primaryMuscles: ['Gluteus Maximus'], secondaryMuscles: ['Hamstrings'], movement: 'glute', rest: 90 },
  { id: 'barbell-glute-bridge', name: 'Barbell Glute Bridge', category: 'Glutes', equipment: 'Barbell', primaryMuscles: ['Gluteus Maximus'], secondaryMuscles: ['Hamstrings'], movement: 'glute', rest: 90 },
  { id: 'cable-glute-kickback', name: 'Cable Glute Kickback', category: 'Glutes', equipment: 'Cable', primaryMuscles: ['Gluteus Maximus'], secondaryMuscles: ['Hamstrings'], movement: 'glute', rest: 60 },
  { id: 'hip-abduction-machine', name: 'Hip Abduction Machine', category: 'Glutes', equipment: 'Machine', primaryMuscles: ['Gluteus Medius'], secondaryMuscles: ['Gluteus Minimus'], movement: 'raise', rest: 60 },
  { id: 'banded-glute-bridge', name: 'Banded Glute Bridge', category: 'Glutes', equipment: 'Resistance Band', primaryMuscles: ['Gluteus Maximus'], secondaryMuscles: ['Gluteus Medius'], movement: 'glute', rest: 60 },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', category: 'Glutes', equipment: 'Barbell', primaryMuscles: ['Glutes', 'Adductors'], secondaryMuscles: ['Quadriceps', 'Hamstrings'], movement: 'hinge', rest: 150 },

  // Calves
  { id: 'standing-calf-raise-machine', name: 'Standing Calf Raise', category: 'Calves', equipment: 'Machine', primaryMuscles: ['Gastrocnemius'], secondaryMuscles: ['Soleus'], movement: 'calf', rest: 60 },
  { id: 'seated-calf-raise-machine', name: 'Seated Calf Raise', category: 'Calves', equipment: 'Machine', primaryMuscles: ['Soleus'], secondaryMuscles: ['Gastrocnemius'], movement: 'calf', rest: 60 },
  { id: 'single-leg-dumbbell-calf-raise', name: 'Single-Leg Dumbbell Calf Raise', category: 'Calves', equipment: 'Dumbbell', primaryMuscles: ['Gastrocnemius'], secondaryMuscles: ['Soleus'], movement: 'calf', rest: 60 },

  // Biceps
  { id: 'ez-bar-biceps-curl', name: 'EZ-Bar Biceps Curl', category: 'Biceps', equipment: 'EZ Curl Bar', primaryMuscles: ['Biceps Brachii'], secondaryMuscles: ['Brachialis', 'Forearms'], movement: 'curl', rest: 75 },
  { id: 'ez-bar-preacher-curl', name: 'EZ-Bar Preacher Curl', category: 'Biceps', equipment: 'EZ Curl Bar', primaryMuscles: ['Biceps Brachii'], secondaryMuscles: ['Brachialis'], movement: 'curl', rest: 60 },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', category: 'Biceps', equipment: 'Dumbbell', primaryMuscles: ['Biceps Brachii'], secondaryMuscles: ['Brachialis'], movement: 'curl', rest: 60 },
  { id: 'dumbbell-hammer-curl', name: 'Dumbbell Hammer Curl', category: 'Biceps', equipment: 'Dumbbell', primaryMuscles: ['Brachialis', 'Brachioradialis'], secondaryMuscles: ['Biceps Brachii'], movement: 'curl', rest: 60 },
  { id: 'straight-bar-cable-curl', name: 'Straight-Bar Cable Curl', category: 'Biceps', equipment: 'Cable', primaryMuscles: ['Biceps Brachii'], secondaryMuscles: ['Brachialis'], movement: 'curl', rest: 60 },
  { id: 'rope-hammer-cable-curl', name: 'Rope Hammer Cable Curl', category: 'Biceps', equipment: 'Cable', primaryMuscles: ['Brachialis', 'Brachioradialis'], secondaryMuscles: ['Biceps Brachii'], movement: 'curl', rest: 60 },
  { id: 'concentration-curl', name: 'Concentration Curl', category: 'Biceps', equipment: 'Dumbbell', primaryMuscles: ['Biceps Brachii'], movement: 'curl', rest: 60 },

  // Forearms
  { id: 'barbell-wrist-curl', name: 'Barbell Wrist Curl', category: 'Forearms', equipment: 'Barbell', primaryMuscles: ['Wrist Flexors'], movement: 'curl', rest: 45 },
  { id: 'barbell-reverse-wrist-curl', name: 'Reverse Wrist Curl', category: 'Forearms', equipment: 'Barbell', primaryMuscles: ['Wrist Extensors'], secondaryMuscles: ['Brachioradialis'], movement: 'curl', rest: 45 },
  { id: 'reverse-ez-bar-curl', name: 'Reverse EZ-Bar Curl', category: 'Forearms', equipment: 'EZ Curl Bar', primaryMuscles: ['Brachioradialis'], secondaryMuscles: ['Wrist Extensors', 'Biceps'], movement: 'curl', rest: 60 },
  { id: 'farmer-carry-trap-bar', name: 'Trap-Bar Farmer Carry', category: 'Forearms', equipment: 'Trap Bar', primaryMuscles: ['Grip', 'Forearms'], secondaryMuscles: ['Trapezius', 'Core'], movement: 'carry', rest: 90 },

  // Triceps
  { id: 'cable-tricep-pushdown-v-bar', name: 'Cable Tricep Pushdown (V-Bar)', category: 'Triceps', equipment: 'Cable', primaryMuscles: ['Triceps Brachii'], movement: 'triceps', rest: 60 },
  { id: 'rope-triceps-pushdown', name: 'Rope Triceps Pushdown', category: 'Triceps', equipment: 'Cable', primaryMuscles: ['Triceps Brachii'], movement: 'triceps', rest: 60 },
  { id: 'overhead-rope-triceps-extension', name: 'Overhead Rope Triceps Extension', category: 'Triceps', equipment: 'Cable', primaryMuscles: ['Triceps Long Head'], secondaryMuscles: ['Triceps Brachii'], movement: 'triceps', rest: 60 },
  { id: 'dumbbell-overhead-triceps-extension', name: 'Dumbbell Overhead Triceps Extension', category: 'Triceps', equipment: 'Dumbbell', primaryMuscles: ['Triceps Long Head'], movement: 'triceps', rest: 60 },
  { id: 'ez-bar-skull-crusher', name: 'EZ-Bar Skull Crusher', category: 'Triceps', equipment: 'EZ Curl Bar', primaryMuscles: ['Triceps Brachii'], movement: 'triceps', rest: 75 },
  { id: 'close-grip-barbell-bench-press', name: 'Close-Grip Barbell Bench Press', category: 'Triceps', equipment: 'Barbell', primaryMuscles: ['Triceps Brachii'], secondaryMuscles: ['Chest', 'Anterior Deltoids'], movement: 'press', rest: 120 },
  { id: 'single-arm-cable-triceps-extension', name: 'Single-Arm Cable Triceps Extension', category: 'Triceps', equipment: 'Cable', primaryMuscles: ['Triceps Brachii'], movement: 'triceps', rest: 60 },
  { id: 'cable-triceps-kickback', name: 'Cable Triceps Kickback', category: 'Triceps', equipment: 'Cable', primaryMuscles: ['Triceps Brachii'], movement: 'triceps', rest: 60 },

  // Core
  { id: 'hanging-knee-raise', name: 'Hanging Knee Raise', category: 'Core', equipment: 'Bodyweight', primaryMuscles: ['Rectus Abdominis'], secondaryMuscles: ['Hip Flexors'], movement: 'core', rest: 60 },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'Core', equipment: 'Bodyweight', primaryMuscles: ['Rectus Abdominis'], secondaryMuscles: ['Hip Flexors'], movement: 'core', rest: 75 },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', category: 'Core', equipment: 'Other', primaryMuscles: ['Rectus Abdominis'], secondaryMuscles: ['Obliques', 'Shoulders'], movement: 'core', rest: 60 },
  { id: 'rope-cable-crunch', name: 'Rope Cable Crunch', category: 'Core', equipment: 'Cable', primaryMuscles: ['Rectus Abdominis'], secondaryMuscles: ['Obliques'], movement: 'core', rest: 60 },
  { id: 'decline-sit-up', name: 'Decline Sit-Up', category: 'Core', equipment: 'Bodyweight', primaryMuscles: ['Rectus Abdominis'], secondaryMuscles: ['Hip Flexors'], movement: 'core', rest: 60 },
  { id: 'pallof-press', name: 'Pallof Press', category: 'Core', equipment: 'Cable', primaryMuscles: ['Obliques'], secondaryMuscles: ['Transverse Abdominis'], movement: 'core', rest: 45 },
  { id: 'cable-woodchop', name: 'Cable Woodchop', category: 'Core', equipment: 'Cable', primaryMuscles: ['Obliques'], secondaryMuscles: ['Rectus Abdominis'], movement: 'core', rest: 60 },
  { id: 'front-plank', name: 'Front Plank', category: 'Core', equipment: 'Bodyweight', primaryMuscles: ['Transverse Abdominis'], secondaryMuscles: ['Rectus Abdominis', 'Glutes'], movement: 'core', rest: 45 },
  { id: 'suspension-body-saw', name: 'Suspension Body Saw', category: 'Core', equipment: 'Suspension Trainer', primaryMuscles: ['Rectus Abdominis'], secondaryMuscles: ['Shoulders', 'Glutes'], movement: 'core', rest: 60 }
];

export const EXPANDED_EXERCISES: Exercise[] = seeds.map((seed) => {
  const cue = movementCues[seed.movement];
  return {
    id: seed.id,
    name: seed.name,
    category: seed.category,
    equipment: seed.equipment,
    primaryMuscles: seed.primaryMuscles,
    secondaryMuscles: seed.secondaryMuscles,
    instructions: [cue.setup, cue.action, cue.return],
    tips: cue.tip,
    defaultRestSeconds: seed.rest
  };
});

