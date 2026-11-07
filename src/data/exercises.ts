import { Exercise } from '../types/fitness';
import { EXPANDED_EXERCISES } from './expandedExercises';

const CORE_EXERCISES: Exercise[] = [
  // CHEST
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    category: 'Chest',
    equipment: 'Barbell',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid', 'Triceps Brachii'],
    instructions: [
      'Lie flat on bench with eyes directly under the bar.',
      'Grip the bar with hands slightly wider than shoulder-width.',
      'Arch lower back naturally, plant feet firmly into the floor.',
      'Unrack and lower barbell smoothly to mid-chest/nipple line.',
      'Press upward explosively through palms until arms are extended.'
    ],
    tips: 'Keep shoulder blades retracted and pinched into the bench throughout the lift.',
    defaultRestSeconds: 120
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'Chest',
    equipment: 'Dumbbell',
    primaryMuscles: ['Clavicular Pectoralis (Upper Chest)'],
    secondaryMuscles: ['Anterior Deltoids', 'Triceps'],
    instructions: [
      'Set incline bench between 30 and 45 degrees.',
      'Kick dumbbells up to shoulder level as you lean back.',
      'Press dumbbells up and slightly inward over mid-chest.',
      'Lower with control until thumbs touch outer chest line.'
    ],
    tips: 'Avoid bench angle higher than 45 degrees to avoid shifting load to front delts.',
    defaultRestSeconds: 90
  },
  {
    id: 'cable-chest-fly',
    name: 'Cable Chest Fly',
    category: 'Chest',
    equipment: 'Cable',
    primaryMuscles: ['Pectoralis Major (Sternal Head)'],
    secondaryMuscles: ['Biceps Brachii (Short Head)'],
    instructions: [
      'Set pulleys to chest height or slightly higher.',
      'Take handles, step forward with staggered stance.',
      'With slight elbow bend, hug arms inward in a hugging arc.',
      'Squeeze chest hard for 1 second at peak contraction.'
    ],
    tips: 'Do not bend and straighten elbows dynamically—keep elbow angle static.',
    defaultRestSeconds: 60
  },
  {
    id: 'chest-dips',
    name: 'Chest Dips',
    category: 'Chest',
    equipment: 'Bodyweight',
    primaryMuscles: ['Lower Pectorals'],
    secondaryMuscles: ['Triceps', 'Anterior Deltoid'],
    instructions: [
      'Hold parallel bars, lean torso forward roughly 30 degrees.',
      'Lower body until shoulders are below elbows.',
      'Drive upwards through the heels of hands back to start.'
    ],
    tips: 'Leaning forward emphasizes chest; staying upright biases triceps.',
    defaultRestSeconds: 90
  },

  // BACK
  {
    id: 'barbell-deadlift',
    name: 'Conventional Barbell Deadlift',
    category: 'Back',
    equipment: 'Barbell',
    primaryMuscles: ['Erector Spinae', 'Latissimus Dorsi', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Trapezius', 'Forearms'],
    instructions: [
      'Stand with midfoot under the barbell, feet hip-width.',
      'Hinge hips back and grip bar just outside knees.',
      'Pull chest up, engage lats, and flatten spine.',
      'Drive the floor away through midfoot, standing tall with hip lockout.'
    ],
    tips: 'Do not hyperextend at the top. Keep the bar dragging against your shins.',
    defaultRestSeconds: 180
  },
  {
    id: 'barbell-bent-over-row',
    name: 'Barbell Bent-Over Row',
    category: 'Back',
    equipment: 'Barbell',
    primaryMuscles: ['Latissimus Dorsi', 'Rhomboids'],
    secondaryMuscles: ['Biceps', 'Posterior Deltoids', 'Lower Back'],
    instructions: [
      'Hinge forward at roughly 45 degrees with flat spine.',
      'Grip barbell overhand slightly wider than shoulder width.',
      'Pull bar towards your belly button, pulling with elbows.',
      'Squeeze shoulder blades together, lower under control.'
    ],
    tips: 'Keep core tightly braced to protect lumbar spine.',
    defaultRestSeconds: 90
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'Back',
    equipment: 'Cable',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Biceps Brachii', 'Teres Major'],
    instructions: [
      'Sit facing machine with thigh pads snug over knees.',
      'Grip bar wider than shoulder-width with overhand grip.',
      'Lean back 10-15 degrees, drive elbows down toward ribs.',
      'Touch bar gently to upper chest, return slowly to full stretch.'
    ],
    tips: 'Initiate by depressing scapula before bending elbows.',
    defaultRestSeconds: 75
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'Back',
    equipment: 'Cable',
    primaryMuscles: ['Mid-Traps', 'Rhomboids', 'Lats'],
    secondaryMuscles: ['Biceps', 'Erectors'],
    instructions: [
      'Sit upright with knees slightly bent, feet on footplates.',
      'Pull handle toward lower abdomen while keeping spine tall.',
      'Pinch shoulder blades hard at peak, avoid excessive torso swinging.'
    ],
    tips: 'Maintain neutral posture and avoid using momentum.',
    defaultRestSeconds: 75
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    category: 'Back',
    equipment: 'Bodyweight',
    primaryMuscles: ['Lats', 'Upper Back'],
    secondaryMuscles: ['Biceps', 'Core'],
    instructions: [
      'Hang from bar with overhand grip slightly wider than shoulders.',
      'Pull chest toward bar until chin clearly clears the bar.',
      'Lower down smoothly to full dead hang.'
    ],
    tips: 'Engage core to prevent swinging legs.',
    defaultRestSeconds: 90
  },

  // LEGS - QUADS & GLUTES
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    category: 'Quads',
    equipment: 'Barbell',
    primaryMuscles: ['Quadriceps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Adductors', 'Calves', 'Core'],
    instructions: [
      'Rest bar across upper traps (high bar) or rear delts (low bar).',
      'Stand shoulder-width apart, toes flared slightly out.',
      'Descend by breaking at hips and knees simultaneously.',
      'Hit parallel depth (crease of hip at or below knee).',
      'Drive powerfully up through the midfoot to lockout.'
    ],
    tips: 'Keep knees tracking in line with toes throughout the motion.',
    defaultRestSeconds: 150
  },
  {
    id: 'leg-press',
    name: 'Leg Press (45 Degree)',
    category: 'Quads',
    equipment: 'Machine',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Adductors'],
    instructions: [
      'Sit comfortably in sled with back and head flat against pads.',
      'Place feet shoulder-width on platform.',
      'Release safety handles and lower carriage until knees reach 90 degrees.',
      'Press sled up without locking knees aggressively at top.'
    ],
    tips: 'Never let your lower back peel off the back pad.',
    defaultRestSeconds: 90
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'Quads',
    equipment: 'Machine',
    primaryMuscles: ['Rectus Femoris', 'Vastus Lateralis'],
    instructions: [
      'Align knee joint with machine pivot axis.',
      'Extend legs upwards until quads are fully contracted.',
      'Hold peak squeeze for 1 second, lower slowly.'
    ],
    tips: 'Great quad isolation movement; keep butt firmly in seat.',
    defaultRestSeconds: 60
  },

  // LEGS - HAMSTRINGS & CALVES
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    category: 'Hamstrings',
    equipment: 'Barbell',
    primaryMuscles: ['Hamstrings', 'Gluteus Maximus'],
    secondaryMuscles: ['Erector Spinae', 'Lats'],
    instructions: [
      'Hold barbell at hip level with shoulder-width grip.',
      'Unlock knees slightly, then push hips backwards as far as possible.',
      'Lower bar closely along shins until you feel deep hamstring stretch.',
      'Contract glutes and hamstrings to snap hips back forward.'
    ],
    tips: 'Keep spine flat like a tabletop. Shin angle should remain vertical.',
    defaultRestSeconds: 100
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    category: 'Hamstrings',
    equipment: 'Machine',
    primaryMuscles: ['Hamstrings (Biceps Femoris)'],
    instructions: [
      'Lie face down on machine with pad against lower calves.',
      'Curl heels toward buttocks through full range of motion.',
      'Lower with strict 3-second eccentric tempo.'
    ],
    tips: 'Do not raise hips off the bench while curling.',
    defaultRestSeconds: 60
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'Calves',
    equipment: 'Machine',
    primaryMuscles: ['Gastrocnemius', 'Soleus'],
    instructions: [
      'Place balls of feet on step with heels hanging off.',
      'Lower heels into a deep calf stretch for 2 seconds.',
      'Drive high up onto big toes and hold squeeze for 2 seconds.'
    ],
    tips: 'Pausing at bottom removes Achilles tendon rebound bounce.',
    defaultRestSeconds: 60
  },

  // SHOULDERS
  {
    id: 'overhead-press',
    name: 'Standing Overhead Barbell Press',
    category: 'Shoulders',
    equipment: 'Barbell',
    primaryMuscles: ['Anterior Deltoid', 'Lateral Deltoid'],
    secondaryMuscles: ['Triceps', 'Upper Traps', 'Core'],
    instructions: [
      'Hold bar at clavicle level with forearms vertical.',
      'Brace glutes, quads, and abs firmly.',
      'Press bar vertically overhead, moving head back then forward through the window.',
      'Lock out arms directly above ears.'
    ],
    tips: 'Keep ribcage clamped down; do not arch lumbar spine backwards.',
    defaultRestSeconds: 120
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
    equipment: 'Dumbbell',
    primaryMuscles: ['Lateral Deltoid'],
    secondaryMuscles: ['Trapezius'],
    instructions: [
      'Hold dumbbells at sides with slight forward lean.',
      'Raise arms laterally leading with elbows until parallel with floor.',
      'Pour water motion slightly at the top, lower smoothly.'
    ],
    tips: 'Use moderate weights to keep tension on side delts instead of traps.',
    defaultRestSeconds: 60
  },
  {
    id: 'face-pull',
    name: 'Cable Face Pull',
    category: 'Shoulders',
    equipment: 'Cable',
    primaryMuscles: ['Rear Deltoids', 'Rotator Cuff'],
    secondaryMuscles: ['Rhomboids', 'Traps'],
    instructions: [
      'Attach rope to upper pulley at eye height.',
      'Step back, pull rope directly toward eyes while pulling hands apart.',
      'Externally rotate shoulders at the finish position.'
    ],
    tips: 'Essential for shoulder health and balancing pressing volume.',
    defaultRestSeconds: 60
  },

  // ARMS - BICEPS & TRICEPS
  {
    id: 'barbell-bicep-curl',
    name: 'Barbell Bicep Curl',
    category: 'Biceps',
    equipment: 'Barbell',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Forearms'],
    instructions: [
      'Stand tall holding barbell with shoulder-width underhand grip.',
      'Pin elbows to sides of torso.',
      'Curl bar up toward chest without rocking body.',
      'Lower bar with controlled 2-second negative.'
    ],
    tips: 'Avoid swinging torso backward to throw up heavy weight.',
    defaultRestSeconds: 75
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    category: 'Biceps',
    equipment: 'Dumbbell',
    primaryMuscles: ['Biceps Long Head (Peak)'],
    instructions: [
      'Sit back on a 45-degree incline bench with arms hanging.',
      'Curl dumbbells simultaneously, supinating wrists at top.',
      'Lower all the way down to a deep bicep stretch.'
    ],
    tips: 'Keep upper arms perpendicular to the floor.',
    defaultRestSeconds: 60
  },
  {
    id: 'tricep-rope-pushdown',
    name: 'Cable Tricep Rope Pushdown',
    category: 'Triceps',
    equipment: 'Cable',
    primaryMuscles: ['Triceps Brachii (Lateral & Medial Heads)'],
    instructions: [
      'Attach rope to high pulley, hold ends with neutral palms.',
      'Pin elbows close to ribs.',
      'Push down and flare rope ends apart at lockout.',
      'Return slowly until forearms are parallel to floor.'
    ],
    tips: 'Keep elbows stationary like door hinges.',
    defaultRestSeconds: 60
  },
  {
    id: 'skull-crushers',
    name: 'Lying Tricep Extension (Skull Crushers)',
    category: 'Triceps',
    equipment: 'Barbell',
    primaryMuscles: ['Triceps Long Head'],
    instructions: [
      'Lie flat on bench holding EZ curl bar over chest.',
      'Angle upper arms slightly back past vertical.',
      'Bend elbows to lower bar towards forehead/crown of head.',
      'Extend forearms back up to starting position.'
    ],
    tips: 'Angling upper arms backward maintains constant tension at top.',
    defaultRestSeconds: 75
  },

  // CORE
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'Core',
    equipment: 'Bodyweight',
    primaryMuscles: ['Rectus Abdominis', 'Iliopsoas'],
    instructions: [
      'Hang from pull-up bar with overhand grip.',
      'Raise straight legs or knees up until thighs are at 90 degrees or higher.',
      'Tilt pelvis upward to engage abs, lower smoothly.'
    ],
    tips: 'Avoid swinging momentum; curl spine slightly at top.',
    defaultRestSeconds: 60
  },
  {
    id: 'cable-woodchopper',
    name: 'Cable Woodchopper',
    category: 'Core',
    equipment: 'Cable',
    primaryMuscles: ['Obliques', 'Transverse Abdominis'],
    instructions: [
      'Set pulley high, stand sideways with wide athletic stance.',
      'Grip handle with both hands, rotate diagonally across body down to opposite knee.',
      'Rotate through torso and hips with controlled power.'
    ],
    tips: 'Pivot rear foot as you rotate.',
    defaultRestSeconds: 60
  }
];

export const INITIAL_EXERCISES: Exercise[] = [...CORE_EXERCISES, ...EXPANDED_EXERCISES];
