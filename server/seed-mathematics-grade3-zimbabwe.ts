import { db } from './db';
import { subjects, subjectChapters, subjectLessons, subjectExercises } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { ensureAdminUser } from './ensure-admin-user';

interface MathLesson {
  lesson: number;
  topic: string;
  content: string;
  examples: string[];
  activities: string[];
}

interface MathUnit {
  unit: number;
  title: string;
  lessons: MathLesson[];
}

const mathematicsGrade3Units: MathUnit[] = [
  {
    unit: 1,
    title: "Numbers and Place Value",
    lessons: [
      {
        lesson: 1,
        topic: "Counting and Writing Numbers up to 1000",
        content: `Numbers help us count, measure, and order things in our daily lives. In Grade 3, we learn to work with numbers up to 1000.

**Understanding Place Value:**
Each digit in a number has a place and a value:
- **Ones place** (Units): The rightmost digit
- **Tens place**: The middle digit
- **Hundreds place**: The leftmost digit

**Example:** In the number 456:
- 4 is in the hundreds place = 400
- 5 is in the tens place = 50
- 6 is in the ones place = 6
- So, 456 = 400 + 50 + 6

**Counting in Groups:**
- Count by 1s: 1, 2, 3, 4, 5...
- Count by 2s: 2, 4, 6, 8, 10...
- Count by 5s: 5, 10, 15, 20, 25...
- Count by 10s: 10, 20, 30, 40, 50...
- Count by 100s: 100, 200, 300, 400, 500...`,
        examples: [
          "234 = 200 + 30 + 4 (two hundred and thirty-four)",
          "607 = 600 + 0 + 7 (six hundred and seven)",
          "890 = 800 + 90 + 0 (eight hundred and ninety)",
          "Count by 10s from 120: 120, 130, 140, 150, 160..."
        ],
        activities: [
          "Write the number 'three hundred and forty-five' in digits.",
          "Break down 678 into hundreds, tens, and ones.",
          "Count by 5s from 105 to 150.",
          "What number comes after 499?"
        ]
      },
      {
        lesson: 2,
        topic: "Comparing and Ordering Numbers",
        content: `We compare numbers to find which is greater, smaller, or if they are equal.

**Comparison Symbols:**
- **>** means "greater than"
- **<** means "less than"
- **=** means "equal to"

**How to Compare Numbers:**
1. Compare the hundreds first
2. If hundreds are the same, compare the tens
3. If tens are the same, compare the ones

**Ordering Numbers:**
- **Ascending order**: From smallest to largest (going up)
- **Descending order**: From largest to smallest (going down)`,
        examples: [
          "456 > 234 (456 is greater than 234)",
          "123 < 456 (123 is less than 456)",
          "Order: 234, 567, 123 → Ascending: 123, 234, 567",
          "Descending order: 890, 456, 234"
        ],
        activities: [
          "Compare: 345 ___ 354 (use >, <, or =)",
          "Order these numbers: 678, 234, 890, 456 (ascending)",
          "Which is greater: 607 or 670?",
          "Arrange in descending order: 123, 789, 456"
        ]
      },
      {
        lesson: 3,
        topic: "Even and Odd Numbers",
        content: `Numbers can be classified as even or odd based on whether they can be divided evenly by 2.

**Even Numbers:**
- Can be divided by 2 with no remainder
- End in 0, 2, 4, 6, or 8
- Examples: 2, 4, 6, 8, 10, 12, 14...

**Odd Numbers:**
- Cannot be divided evenly by 2
- End in 1, 3, 5, 7, or 9
- Examples: 1, 3, 5, 7, 9, 11, 13...

**Patterns:**
- Even + Even = Even
- Odd + Odd = Even
- Even + Odd = Odd`,
        examples: [
          "24 is even (ends in 4)",
          "37 is odd (ends in 7)",
          "100 is even (ends in 0)",
          "Is 456 even or odd? Even (ends in 6)"
        ],
        activities: [
          "Circle the even numbers: 12, 15, 18, 21, 24",
          "List 5 odd numbers between 40 and 60.",
          "Is 789 even or odd?",
          "What is the next even number after 56?"
        ]
      }
    ]
  },
  {
    unit: 2,
    title: "Addition and Subtraction",
    lessons: [
      {
        lesson: 1,
        topic: "Addition with Regrouping (Carrying)",
        content: `Addition means combining two or more numbers to find their total. When adding, we sometimes need to regroup (carry over).

**Steps for Addition with Regrouping:**
1. Line up the numbers by place value (ones under ones, tens under tens)
2. Add the ones column first
3. If the sum is 10 or more, write the ones digit and carry the tens
4. Add the tens column (including any carried number)
5. Add the hundreds column

**Example:** 456 + 287
  456
+ 287
-----
  743

- Ones: 6 + 7 = 13 (write 3, carry 1)
- Tens: 5 + 8 + 1 = 14 (write 4, carry 1)
- Hundreds: 4 + 2 + 1 = 7`,
        examples: [
          "245 + 178 = 423",
          "567 + 289 = 856",
          "123 + 456 = 579",
          "678 + 234 = 912"
        ],
        activities: [
          "Add: 345 + 267",
          "Solve: 456 + 389",
          "What is 234 + 578?",
          "Add three numbers: 123 + 234 + 345"
        ]
      },
      {
        lesson: 2,
        topic: "Subtraction with Borrowing",
        content: `Subtraction means taking away one number from another. Sometimes we need to borrow from the next column.

**Steps for Subtraction with Borrowing:**
1. Line up numbers by place value
2. Start with the ones column
3. If the top digit is smaller, borrow 10 from the tens column
4. Subtract each column from right to left

**Example:** 542 - 287
  542
- 287
-----
  255

- Ones: Can't do 2 - 7, borrow: 12 - 7 = 5
- Tens: 3 - 8, borrow: 13 - 8 = 5
- Hundreds: 4 - 2 = 2`,
        examples: [
          "456 - 178 = 278",
          "834 - 456 = 378",
          "601 - 234 = 367",
          "900 - 456 = 444"
        ],
        activities: [
          "Subtract: 654 - 278",
          "Solve: 801 - 456",
          "What is 500 - 234?",
          "Find the difference: 923 - 567"
        ]
      },
      {
        lesson: 3,
        topic: "Word Problems - Addition and Subtraction",
        content: `Word problems help us use math in real-life situations. We need to read carefully and decide whether to add or subtract.

**When to Add:**
- Combining things (total, altogether, in all)
- Increasing (more, gain, receive)

**When to Subtract:**
- Taking away (left, remaining, difference)
- Comparing (how many more, how many less)

**Steps to Solve:**
1. Read the problem carefully
2. Identify what you need to find
3. Decide: add or subtract?
4. Write the number sentence
5. Solve and check your answer`,
        examples: [
          "Tendai has 234 marbles. His friend gives him 178 more. How many does he have now? (234 + 178 = 412)",
          "A shop had 567 loaves of bread. They sold 289. How many are left? (567 - 289 = 278)",
          "There are 345 girls and 298 boys in a school. How many students in total? (345 + 298 = 643)",
          "A farmer had 800 chickens. He sold 456. How many remain? (800 - 456 = 344)"
        ],
        activities: [
          "Rudo collected 456 bottle tops. Tanya collected 234. How many altogether?",
          "A bus had 678 passengers. 289 got off. How many are left?",
          "Create your own addition word problem.",
          "Write a subtraction problem about fruits."
        ]
      }
    ]
  },
  {
    unit: 3,
    title: "Multiplication and Division",
    lessons: [
      {
        lesson: 1,
        topic: "Introduction to Multiplication",
        content: `Multiplication is repeated addition. Instead of adding the same number many times, we multiply.

**Understanding Multiplication:**
- 3 × 4 means "3 groups of 4" or "4 + 4 + 4"
- The × symbol means "times" or "multiplied by"
- 3 × 4 = 12 (three fours equal twelve)

**Multiplication Tables (2 to 10):**
Learning times tables helps you multiply quickly:
- 2 times table: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
- 5 times table: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50
- 10 times table: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100

**Properties:**
- Order doesn't matter: 3 × 4 = 4 × 3
- Any number × 0 = 0
- Any number × 1 = that number`,
        examples: [
          "5 × 3 = 15 (five threes: 3 + 3 + 3 + 3 + 3)",
          "4 × 7 = 28",
          "6 × 5 = 30",
          "8 × 3 = 24"
        ],
        activities: [
          "Write the 3 times table up to 3 × 10.",
          "Calculate: 7 × 4",
          "If one bag has 6 oranges, how many in 5 bags?",
          "Draw 4 groups of 3 dots. How many dots in total?"
        ]
      },
      {
        lesson: 2,
        topic: "Introduction to Division",
        content: `Division means sharing or grouping equally. It's the opposite of multiplication.

**Understanding Division:**
- 12 ÷ 3 means "12 divided into 3 equal groups"
- The ÷ symbol means "divided by"
- 12 ÷ 3 = 4 (twelve divided by three equals four)

**Two Types of Division:**
1. **Sharing:** Divide 12 sweets among 3 children equally
2. **Grouping:** How many groups of 3 can you make from 12?

**Relationship with Multiplication:**
- If 3 × 4 = 12, then 12 ÷ 3 = 4 and 12 ÷ 4 = 3
- Division undoes multiplication

**Division Facts:**
- Any number ÷ 1 = that number
- Any number ÷ itself = 1
- 0 ÷ any number = 0`,
        examples: [
          "20 ÷ 4 = 5 (twenty divided by four equals five)",
          "15 ÷ 3 = 5",
          "24 ÷ 6 = 4",
          "30 ÷ 5 = 6"
        ],
        activities: [
          "Divide 18 apples equally among 3 children. How many each?",
          "Calculate: 28 ÷ 7",
          "If 6 × 5 = 30, what is 30 ÷ 6?",
          "Share 24 pencils among 4 students equally."
        ]
      },
      {
        lesson: 3,
        topic: "Multiplication and Division Word Problems",
        content: `We use multiplication when we have equal groups, and division when we share or group equally.

**When to Multiply:**
- Finding the total of equal groups
- Keywords: times, groups of, altogether

**When to Divide:**
- Sharing equally
- Making equal groups
- Keywords: share, divide, each, per

**Problem-Solving Steps:**
1. Read carefully
2. Identify the operation needed
3. Write the number sentence
4. Solve
5. Check if your answer makes sense`,
        examples: [
          "There are 5 boxes. Each box has 8 pencils. How many pencils in total? (5 × 8 = 40)",
          "Share 24 sweets equally among 6 children. How many each? (24 ÷ 6 = 4)",
          "A farmer has 7 cows. Each cow gives 5 litres of milk daily. Total milk? (7 × 5 = 35 litres)",
          "36 students need to sit in rows of 6. How many rows? (36 ÷ 6 = 6 rows)"
        ],
        activities: [
          "There are 8 bags with 7 oranges each. How many oranges?",
          "Divide 45 books equally among 9 students.",
          "A packet has 6 biscuits. How many in 7 packets?",
          "30 children form teams of 5. How many teams?"
        ]
      }
    ]
  },
  {
    unit: 4,
    title: "Fractions",
    lessons: [
      {
        lesson: 1,
        topic: "Understanding Fractions",
        content: `A fraction represents a part of a whole. We use fractions when something is divided into equal parts.

**Parts of a Fraction:**
- **Numerator** (top number): How many parts we have
- **Denominator** (bottom number): How many equal parts in total
- Example: In ½, 1 is the numerator and 2 is the denominator

**Common Fractions:**
- **½** (one-half): One part out of two equal parts
- **¼** (one-quarter): One part out of four equal parts
- **¾** (three-quarters): Three parts out of four equal parts
- **⅓** (one-third): One part out of three equal parts

**Reading Fractions:**
- ½ is read as "one-half"
- ¼ is read as "one-quarter"
- ⅓ is read as "one-third"`,
        examples: [
          "Cut a pizza into 4 equal pieces. Each piece is ¼ of the pizza.",
          "Share a chocolate bar equally between 2 people. Each gets ½.",
          "Divide an orange into 3 equal parts. Each part is ⅓.",
          "If you eat 2 out of 4 equal pieces, you ate 2/4 or ½."
        ],
        activities: [
          "Draw a circle and shade ½ of it.",
          "Divide a rectangle into 4 equal parts and color ¾.",
          "What fraction is shaded if 1 out of 3 parts is colored?",
          "If a cake is cut into 8 equal pieces and you eat 2, what fraction did you eat?"
        ]
      },
      {
        lesson: 2,
        topic: "Comparing Fractions",
        content: `We can compare fractions to see which is larger or smaller.

**Comparing Fractions with Same Denominator:**
When the bottom numbers (denominators) are the same, compare the top numbers:
- ⅗ > ⅖ (3 is greater than 2)
- ⅚ > ⅔ (5 sixths is more than 4 sixths)

**Comparing Unit Fractions:**
Unit fractions have 1 as the numerator:
- When denominators are different, the smaller denominator is the larger fraction
- ½ > ¼ (halves are bigger than quarters)
- ⅓ > ⅕ (thirds are bigger than fifths)

**Using Pictures:**
Drawing fractions helps us see which is bigger.`,
        examples: [
          "½ > ¼ (one-half is greater than one-quarter)",
          "⅔ > ⅓ (two-thirds is greater than one-third)",
          "¼ = 2/8 (one-quarter equals two-eighths)",
          "⅗ < ⅘ (three-fifths is less than four-fifths)"
        ],
        activities: [
          "Which is greater: ½ or ⅓?",
          "Compare: ⅔ ___ ⅓ (use >, <, or =)",
          "Order from smallest to largest: ¼, ½, ⅓",
          "Draw pictures to show that ½ > ¼"
        ]
      },
      {
        lesson: 3,
        topic: "Adding Simple Fractions",
        content: `We can add fractions when they have the same denominator (bottom number).

**Adding Fractions with Same Denominator:**
- Keep the denominator the same
- Add only the numerators (top numbers)
- Example: ⅕ + ⅖ = ⅗

**Steps:**
1. Check that denominators are the same
2. Add the numerators
3. Write the sum over the same denominator
4. Simplify if possible

**Important:**
- Only add the numerators, not the denominators
- ⅓ + ⅓ = ⅔ (NOT 2/6)`,
        examples: [
          "¼ + ¼ = 2/4 = ½",
          "⅓ + ⅓ = ⅔",
          "⅕ + ⅖ = ⅗",
          "⅛ + ⅜ = 4/8 = ½"
        ],
        activities: [
          "Add: ⅓ + ⅓",
          "Calculate: ⅕ + ⅖",
          "Solve: ¼ + ¼ + ¼",
          "Draw pictures to show ⅓ + ⅔"
        ]
      }
    ]
  },
  {
    unit: 5,
    title: "Measurement",
    lessons: [
      {
        lesson: 1,
        topic: "Length - Metres and Centimetres",
        content: `Length is how long or tall something is. We measure length using units like metres (m) and centimetres (cm).

**Units of Length:**
- **Centimetre (cm)**: Used for small objects (pencil, book)
- **Metre (m)**: Used for longer distances (classroom, height)
- **1 metre = 100 centimetres**

**Measuring Tools:**
- Ruler: measures in cm
- Metre stick/tape: measures in m
- Measuring tape: measures in both

**Converting:**
- To convert metres to centimetres: multiply by 100
- To convert centimetres to metres: divide by 100
- Example: 3m = 300cm`,
        examples: [
          "A pencil is about 15 cm long",
          "A door is about 2 metres tall",
          "2m = 200cm",
          "350cm = 3m 50cm or 3.5m"
        ],
        activities: [
          "Measure your desk using a ruler.",
          "Convert: 5m = ___ cm",
          "Which is longer: 3m or 250cm?",
          "Measure your height. How tall are you?"
        ]
      },
      {
        lesson: 2,
        topic: "Mass - Kilograms and Grams",
        content: `Mass is how heavy something is. We measure mass using kilograms (kg) and grams (g).

**Units of Mass:**
- **Gram (g)**: For light objects (apple, pencil)
- **Kilogram (kg)**: For heavier objects (bag of maize, person)
- **1 kilogram = 1000 grams**

**Measuring Mass:**
- We use a scale or balance
- Small items: use grams
- Larger items: use kilograms

**Converting:**
- To convert kg to g: multiply by 1000
- To convert g to kg: divide by 1000
- Example: 2kg = 2000g`,
        examples: [
          "An apple weighs about 150g",
          "A bag of sugar weighs 1kg or 1000g",
          "3kg = 3000g",
          "2500g = 2kg 500g or 2.5kg"
        ],
        activities: [
          "Convert: 4kg = ___ g",
          "Which is heavier: 2kg or 1500g?",
          "What items in your classroom weigh about 1kg?",
          "If one orange weighs 200g, how much do 5 oranges weigh?"
        ]
      },
      {
        lesson: 3,
        topic: "Capacity - Litres and Millilitres",
        content: `Capacity is how much liquid a container can hold. We measure capacity using litres (L) and millilitres (mL).

**Units of Capacity:**
- **Millilitre (mL)**: For small amounts (spoon, cup)
- **Litre (L)**: For larger amounts (bottle, bucket)
- **1 litre = 1000 millilitres**

**Common Containers:**
- A cup holds about 250mL
- A bottle holds about 500mL or 1L
- A bucket holds about 10L

**Converting:**
- To convert L to mL: multiply by 1000
- To convert mL to L: divide by 1000
- Example: 2L = 2000mL`,
        examples: [
          "A small juice box holds 200mL",
          "A large milk bottle holds 2L or 2000mL",
          "5L = 5000mL",
          "1500mL = 1L 500mL or 1.5L"
        ],
        activities: [
          "Convert: 3L = ___ mL",
          "Which holds more: 2L or 1800mL?",
          "Find 3 containers at home and estimate their capacity.",
          "If one cup holds 250mL, how many cups fill 1L?"
        ]
      },
      {
        lesson: 4,
        topic: "Time - Reading Clocks",
        content: `Time helps us know when things happen. We measure time using clocks and calendars.

**Reading Time:**
- **Hour hand** (short): Shows the hour
- **Minute hand** (long): Shows the minutes
- 60 minutes = 1 hour

**Telling Time:**
- **O'clock**: When minute hand points to 12 (3:00)
- **Half past**: When minute hand points to 6 (3:30)
- **Quarter past**: When minute hand points to 3 (3:15)
- **Quarter to**: When minute hand points to 9 (2:45)

**Units of Time:**
- 60 seconds = 1 minute
- 60 minutes = 1 hour
- 24 hours = 1 day
- 7 days = 1 week`,
        examples: [
          "If the hour hand is on 3 and minute hand on 12, it's 3:00",
          "When minute hand is on 6, it's half past the hour",
          "School starts at 7:30 (half past seven)",
          "Lunch time is at 12:00 (twelve o'clock)"
        ],
        activities: [
          "What time is it when both hands point to 12?",
          "Draw a clock showing 4:30.",
          "If it's 2:00 now, what time will it be in 1 hour?",
          "How many minutes from 3:15 to 3:30?"
        ]
      }
    ]
  },
  {
    unit: 6,
    title: "Geometry and Shapes",
    lessons: [
      {
        lesson: 1,
        topic: "2D Shapes - Properties",
        content: `2D shapes are flat shapes that we can draw on paper. They have sides and corners.

**Common 2D Shapes:**

**Triangle:**
- 3 straight sides
- 3 corners (vertices)
- 3 angles

**Square:**
- 4 equal sides
- 4 right angles (90°)
- 4 corners

**Rectangle:**
- 4 sides (opposite sides equal)
- 4 right angles
- 4 corners

**Circle:**
- Round shape
- No sides or corners
- Has a center and radius

**Pentagon:** 5 sides and 5 corners
**Hexagon:** 6 sides and 6 corners`,
        examples: [
          "A book cover is a rectangle",
          "A coin is a circle",
          "A slice of pizza is a triangle",
          "A window pane is often a square"
        ],
        activities: [
          "Draw a triangle and count its sides.",
          "Find 3 circular objects in your classroom.",
          "Name the shape: 4 equal sides, 4 corners.",
          "Which shapes have 4 sides?"
        ]
      },
      {
        lesson: 2,
        topic: "3D Shapes - Solids",
        content: `3D shapes are solid shapes that we can hold. They have faces, edges, and vertices (corners).

**Common 3D Shapes:**

**Cube:**
- 6 square faces
- 12 edges
- 8 vertices
- Example: dice, box

**Cuboid (Rectangular Box):**
- 6 rectangular faces
- 12 edges
- 8 vertices
- Example: brick, book

**Sphere:**
- Round like a ball
- No edges or vertices
- Example: football, orange

**Cylinder:**
- 2 circular faces
- 1 curved surface
- Example: tin can, pipe

**Cone:**
- 1 circular face
- 1 vertex at the top
- Example: ice cream cone, party hat`,
        examples: [
          "A box is a cuboid",
          "A ball is a sphere",
          "A tin of beans is a cylinder",
          "An ice cream cone is a cone shape"
        ],
        activities: [
          "Find 3 objects shaped like a cuboid.",
          "Draw a cube and count its faces.",
          "Name 2 things shaped like a sphere.",
          "Which 3D shape has no corners?"
        ]
      },
      {
        lesson: 3,
        topic: "Symmetry",
        content: `Symmetry is when one half of a shape is a mirror image of the other half.

**Line of Symmetry:**
- An imaginary line that divides a shape into two identical halves
- Also called a mirror line
- Each half is a reflection of the other

**Symmetrical Shapes:**
Some shapes have one or more lines of symmetry:
- Circle: infinite lines of symmetry
- Square: 4 lines of symmetry
- Rectangle: 2 lines of symmetry
- Triangle (equilateral): 3 lines of symmetry

**Finding Symmetry:**
- Fold the shape in half
- If both halves match exactly, there is symmetry
- The fold line is the line of symmetry`,
        examples: [
          "A butterfly has a vertical line of symmetry",
          "The letter 'A' is symmetrical",
          "A heart shape has one line of symmetry",
          "The letter 'O' has multiple lines of symmetry"
        ],
        activities: [
          "Draw the other half of a symmetrical butterfly.",
          "Which letters are symmetrical: A, B, C, D?",
          "Fold a paper shape to find lines of symmetry.",
          "Create your own symmetrical pattern."
        ]
      }
    ]
  },
  {
    unit: 7,
    title: "Money",
    lessons: [
      {
        lesson: 1,
        topic: "Identifying Zimbabwean Money",
        content: `Money is what we use to buy goods and services. In Zimbabwe, we use different denominations of notes and coins.

**Understanding Money:**
- **Notes**: Paper money (larger amounts)
- **Coins**: Metal money (smaller amounts)
- **Dollar ($)**: Main unit of currency
- **Cents (¢)**: 100 cents = 1 dollar

**Common Denominations:**
Notes: $1, $2, $5, $10, $20, $50, $100
Coins: 1¢, 5¢, 10¢, 25¢, 50¢

**Value:**
- Each note/coin has a specific value
- Higher numbers mean more value
- $10 is worth more than $5`,
        examples: [
          "$5 note is worth 5 dollars",
          "50¢ is worth half a dollar",
          "$1 = 100¢",
          "$20 is more valuable than $10"
        ],
        activities: [
          "Draw and label a $1 note.",
          "Which is worth more: $5 or $10?",
          "How many cents in $2?",
          "Count: $5 + $2 + $1 = ?"
        ]
      },
      {
        lesson: 2,
        topic: "Adding and Subtracting Money",
        content: `We add and subtract money just like regular numbers, but we must include the dollar sign.

**Adding Money:**
- Line up the decimal points
- Add like normal numbers
- Include $ in the answer
- Example: $5.50 + $3.25 = $8.75

**Subtracting Money:**
- Line up the decimal points
- Subtract like normal numbers
- Include $ in the answer
- Example: $10.00 - $4.50 = $5.50

**Working with Cents:**
- Remember: 100¢ = $1.00
- 50¢ = $0.50
- 25¢ = $0.25`,
        examples: [
          "$3.50 + $2.25 = $5.75",
          "$10.00 - $6.50 = $3.50",
          "$5 + $2 + $1 = $8",
          "$20 - $15 = $5"
        ],
        activities: [
          "Add: $4.50 + $3.25",
          "You have $10. You spend $6. How much left?",
          "Calculate: $7.75 + $2.50",
          "Subtract: $15.00 - $8.25"
        ]
      },
      {
        lesson: 3,
        topic: "Giving Change",
        content: `When we buy something, we often need to calculate change.

**What is Change?**
Change is the money you get back when you pay more than the cost of an item.

**Calculating Change:**
Change = Money Given - Cost of Item

**Steps:**
1. Find out how much the item costs
2. See how much money you gave
3. Subtract the cost from the money given
4. The answer is your change

**Checking:**
Cost + Change should equal the money you gave`,
        examples: [
          "Item costs $7. You pay $10. Change = $10 - $7 = $3",
          "Book costs $4.50. Pay $5. Change = $0.50",
          "Bread costs $2.25. Pay $5. Change = $2.75",
          "Pencil costs $1.50. Pay $2. Change = $0.50"
        ],
        activities: [
          "An apple costs $3. You pay $5. What change?",
          "You buy a ruler for $2.50 with a $5 note. Calculate change.",
          "If a book costs $6.75 and you pay $10, what's your change?",
          "You have $20. After buying for $12.50, how much left?"
        ]
      }
    ]
  },
  {
    unit: 8,
    title: "Data Handling",
    lessons: [
      {
        lesson: 1,
        topic: "Reading Pictographs",
        content: `A pictograph uses pictures or symbols to show data. Each picture represents a number of items.

**Parts of a Pictograph:**
- **Title**: Tells what the graph is about
- **Pictures**: Symbols representing items
- **Key**: Shows what each picture represents
- **Labels**: Names for each category

**Reading a Pictograph:**
1. Read the title
2. Check the key (how many does each picture represent?)
3. Count the pictures in each row
4. Multiply by the key value

**Example Key:**
🍎 = 2 apples
If there are 5 apple symbols, that means 5 × 2 = 10 apples`,
        examples: [
          "If ⭐ = 5 stars, and there are 3 stars shown, total = 15",
          "Key: 🚗 = 10 cars. 4 car symbols = 40 cars",
          "If 👤 = 2 people, 6 symbols = 12 people",
          "Key: 📚 = 5 books. 3 symbols = 15 books"
        ],
        activities: [
          "If each symbol represents 5, what do 4 symbols represent?",
          "Draw a pictograph for: 10 apples, 15 oranges (use symbols)",
          "Read the pictograph and answer: Which has the most?",
          "Create a pictograph showing favorite fruits in your class."
        ]
      },
      {
        lesson: 2,
        topic: "Reading Bar Graphs",
        content: `A bar graph uses bars to show and compare data. The height or length of bars shows the quantity.

**Parts of a Bar Graph:**
- **Title**: What the graph shows
- **Horizontal axis (x)**: Categories
- **Vertical axis (y)**: Numbers/scale
- **Bars**: Show the amount for each category

**Reading a Bar Graph:**
1. Read the title
2. Look at the labels on both axes
3. Check the scale (how much each line represents)
4. Find the height of each bar
5. Compare the bars

**Comparing Data:**
- Tallest bar = most
- Shortest bar = least
- Equal bars = same amount`,
        examples: [
          "If a bar reaches to 20 on the scale, it represents 20 items",
          "Bar A is taller than Bar B means A has more",
          "A bar at 15 shows 15 items",
          "Two bars at the same height show equal amounts"
        ],
        activities: [
          "Which subject has the most students? (from a given graph)",
          "How many more students like Math than Science?",
          "Draw a bar graph for: Math-20, English-15, Science-25",
          "Find the difference between the tallest and shortest bars."
        ]
      },
      {
        lesson: 3,
        topic: "Collecting and Organizing Data",
        content: `Data is information we collect. We organize it to make it easy to understand and compare.

**Steps to Collect Data:**
1. **Ask a question**: What do you want to know?
2. **Collect information**: Survey, observe, or count
3. **Record data**: Use tally marks or a table
4. **Organize**: Put in a chart or table
5. **Display**: Show as a graph

**Tally Marks:**
- I = 1
- II = 2
- III = 3
- IIII = 4
- ~~IIII~~ = 5 (group of 5)

**Using Tables:**
Tables help organize data in rows and columns for easy reading.`,
        examples: [
          "Survey question: 'What's your favorite sport?'",
          "Tally: Soccer ~~IIII~~ III = 8 votes",
          "Create a table showing pets: Dogs-5, Cats-3, Birds-2",
          "Record daily weather for a week using tally marks"
        ],
        activities: [
          "Survey 10 friends about their favorite color. Use tally marks.",
          "Create a table showing results of your survey.",
          "Count items in your pencil case and record in a table.",
          "Ask your class: 'Walk or bus to school?' Record with tallies."
        ]
      }
    ]
  }
];

function generateQuestionsFromMathLesson(lesson: MathLesson, unitTitle: string): Array<{
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}> {
  const questions = [];

  // Topic-specific questions
  if (lesson.topic.includes("Counting and Writing Numbers")) {
    questions.push(
      {
        question: "What is 456 in words?",
        options: ["Four hundred and fifty-six", "Four five six", "Forty-five six", "Four six five"],
        correctAnswer: "Four hundred and fifty-six",
        explanation: "456 is written as 'four hundred and fifty-six'."
      },
      {
        question: "In the number 789, what is the value of 7?",
        options: ["7", "70", "700", "7000"],
        correctAnswer: "700",
        explanation: "7 is in the hundreds place, so its value is 700."
      },
      {
        question: "What number comes after 999?",
        options: ["1000", "998", "9999", "100"],
        correctAnswer: "1000",
        explanation: "After 999 comes 1000 (one thousand)."
      },
      {
        question: "Count by 10s: 230, 240, 250, ___",
        options: ["260", "255", "251", "270"],
        correctAnswer: "260",
        explanation: "Counting by 10s: add 10 each time. 250 + 10 = 260."
      },
      {
        question: "How is 345 broken down by place value?",
        options: ["300 + 40 + 5", "3 + 4 + 5", "30 + 40 + 5", "345 + 0 + 0"],
        correctAnswer: "300 + 40 + 5",
        explanation: "345 = 300 (hundreds) + 40 (tens) + 5 (ones)."
      }
    );
  } else if (lesson.topic.includes("Comparing and Ordering")) {
    questions.push(
      {
        question: "Which number is greater: 456 or 465?",
        options: ["456", "465", "They are equal", "Cannot tell"],
        correctAnswer: "465",
        explanation: "465 is greater than 456 because 6 tens is more than 5 tens."
      },
      {
        question: "Choose the correct symbol: 789 ___ 798",
        options: ["<", ">", "=", "÷"],
        correctAnswer: "<",
        explanation: "789 is less than 798, so we use the < symbol."
      },
      {
        question: "Arrange in ascending order: 567, 234, 890",
        options: ["234, 567, 890", "890, 567, 234", "567, 234, 890", "234, 890, 567"],
        correctAnswer: "234, 567, 890",
        explanation: "Ascending order means from smallest to largest."
      },
      {
        question: "Which is the smallest: 345, 354, 435?",
        options: ["345", "354", "435", "All equal"],
        correctAnswer: "345",
        explanation: "345 is the smallest because it has 3 in the hundreds and 4 in the tens."
      },
      {
        question: "What does > mean?",
        options: ["Greater than", "Less than", "Equal to", "Not equal"],
        correctAnswer: "Greater than",
        explanation: "The symbol > means 'greater than'."
      }
    );
  } else if (lesson.topic.includes("Even and Odd")) {
    questions.push(
      {
        question: "Is 24 even or odd?",
        options: ["Even", "Odd", "Neither", "Both"],
        correctAnswer: "Even",
        explanation: "24 ends in 4, which makes it an even number."
      },
      {
        question: "Which number is odd?",
        options: ["12", "27", "34", "56"],
        correctAnswer: "27",
        explanation: "27 ends in 7, making it an odd number."
      },
      {
        question: "What is the next even number after 48?",
        options: ["49", "50", "47", "46"],
        correctAnswer: "50",
        explanation: "After 48, the next even number is 50."
      },
      {
        question: "Even numbers end in:",
        options: ["0, 2, 4, 6, 8", "1, 3, 5, 7, 9", "Only 0", "Any number"],
        correctAnswer: "0, 2, 4, 6, 8",
        explanation: "Even numbers always end in 0, 2, 4, 6, or 8."
      },
      {
        question: "Is 100 even or odd?",
        options: ["Even", "Odd", "Neither", "Cannot tell"],
        correctAnswer: "Even",
        explanation: "100 ends in 0, so it is an even number."
      }
    );
  } else if (lesson.topic.includes("Addition with Regrouping")) {
    questions.push(
      {
        question: "What is 456 + 287?",
        options: ["743", "633", "643", "733"],
        correctAnswer: "743",
        explanation: "456 + 287 = 743. Add ones (13), carry 1, add tens (14), carry 1, add hundreds (7)."
      },
      {
        question: "Calculate: 234 + 578",
        options: ["812", "802", "712", "822"],
        correctAnswer: "812",
        explanation: "234 + 578 = 812."
      },
      {
        question: "When adding 67 + 58, what do you carry to the tens column?",
        options: ["1", "2", "0", "5"],
        correctAnswer: "1",
        explanation: "7 + 8 = 15. Write 5, carry 1 to tens."
      }
    );
  } else if (lesson.topic.includes("Multiplication")) {
    questions.push(
      {
        question: "What is 5 × 4?",
        options: ["20", "9", "15", "25"],
        correctAnswer: "20",
        explanation: "5 × 4 = 20 (five fours equal twenty)."
      },
      {
        question: "7 × 3 = ?",
        options: ["21", "10", "24", "18"],
        correctAnswer: "21",
        explanation: "7 × 3 = 21 (seven threes equal twenty-one)."
      },
      {
        question: "If one bag has 6 oranges, how many in 4 bags?",
        options: ["24", "10", "20", "18"],
        correctAnswer: "24",
        explanation: "4 × 6 = 24 oranges in total."
      }
    );
  } else if (lesson.topic.includes("Division")) {
    questions.push(
      {
        question: "What is 20 ÷ 4?",
        options: ["5", "4", "16", "24"],
        correctAnswer: "5",
        explanation: "20 ÷ 4 = 5 (twenty divided by four equals five)."
      },
      {
        question: "Share 24 sweets among 6 children equally. How many each?",
        options: ["4", "6", "18", "30"],
        correctAnswer: "4",
        explanation: "24 ÷ 6 = 4 sweets for each child."
      },
      {
        question: "If 5 × 6 = 30, what is 30 ÷ 6?",
        options: ["5", "6", "36", "24"],
        correctAnswer: "5",
        explanation: "Division is the opposite of multiplication. 30 ÷ 6 = 5."
      }
    );
  }

  // Fill with generic questions if needed
  while (questions.length < 5) {
    questions.push({
      question: `Which activity is suggested for practicing ${lesson.topic}?`,
      options: [
        lesson.activities[0] || "Practice with examples",
        "Watch television",
        "Play games unrelated to math",
        "Sleep"
      ],
      correctAnswer: lesson.activities[0] || "Practice with examples",
      explanation: `The lesson suggests: ${lesson.activities[0] || "practicing to improve your skills"}.`
    });
  }

  return questions.slice(0, 5);
}

export async function seedMathematicsGrade3Zimbabwe() {
  try {
    console.log('🔢 Starting Grade 3 Mathematics (Zimbabwe) seeding...');

    // Ensure admin user exists and get their ID
    const adminUserId = await ensureAdminUser();
    console.log(`✅ Using admin user ID: ${adminUserId}`);

    const existingSubject = await db
      .select()
      .from(subjects)
      .where(and(
        eq(subjects.name, 'Mathematics'),
        eq(subjects.gradeLevel, 3),
        eq(subjects.gradeSystem, 'zimbabwe')
      ))
      .limit(1);

    let subjectId: string;

    if (existingSubject.length > 0) {
      console.log('✓ Mathematics Grade 3 subject already exists');
      subjectId = existingSubject[0].id;
      
      // Update existing subject to have admin as creator if not set
      if (!existingSubject[0].createdBy) {
        await db
          .update(subjects)
          .set({ createdBy: adminUserId })
          .where(eq(subjects.id, subjectId));
        console.log('✅ Updated existing subject with admin creator');
      }
    } else {
      const [newSubject] = await db
        .insert(subjects)
        .values({
          name: 'Mathematics',
          gradeSystem: 'zimbabwe',
          gradeLevel: 3,
          description: 'Mathematics curriculum for Grade 3 students in Zimbabwe, covering numbers, operations, fractions, measurement, geometry, money, and data handling.',
          createdBy: adminUserId,
          isActive: true
        })
        .returning();

      subjectId = newSubject.id;
      console.log('✅ Created Mathematics Grade 3 subject with admin as creator');
    }

    for (const unit of mathematicsGrade3Units) {
      const existingChapter = await db
        .select()
        .from(subjectChapters)
        .where(and(
          eq(subjectChapters.subjectId, subjectId),
          eq(subjectChapters.title, unit.title)
        ))
        .limit(1);

      let chapterId: string;

      if (existingChapter.length > 0) {
        console.log(`⏭️  Unit "${unit.title}" already exists, skipping...`);
        chapterId = existingChapter[0].id;
        
        const existingLessons = await db
          .select()
          .from(subjectLessons)
          .where(eq(subjectLessons.chapterId, chapterId));

        if (existingLessons.length > 0) {
          console.log(`  ⏭️  Lessons already exist for this unit`);
          continue;
        }
      } else {
        const [newChapter] = await db
          .insert(subjectChapters)
          .values({
            subjectId: subjectId,
            title: unit.title,
            description: `Unit ${unit.unit}: ${unit.title}`,
            order: unit.unit,
            isActive: true
          })
          .returning();

        chapterId = newChapter.id;
        console.log(`✅ Created Unit ${unit.unit}: ${unit.title}`);
      }

      for (let i = 0; i < unit.lessons.length; i++) {
        const lesson = unit.lessons[i];

        const [insertedLesson] = await db
          .insert(subjectLessons)
          .values({
            chapterId: chapterId,
            title: lesson.topic,
            notes: lesson.content,
            examples: lesson.examples,
            cloudinaryImages: [],
            order: i + 1,
            durationMinutes: 35,
            isActive: true
          })
          .returning();

        console.log(`  ✅ Created Lesson ${i + 1}: ${lesson.topic}`);

        const quizQuestions = generateQuestionsFromMathLesson(lesson, unit.title);
        for (let j = 0; j < quizQuestions.length; j++) {
          const question = quizQuestions[j];
          
          await db
            .insert(subjectExercises)
            .values({
              lessonId: insertedLesson.id,
              question: question.question,
              options: question.options,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              order: j + 1,
              isActive: true
            });
        }
        console.log(`  ✅ Added ${quizQuestions.length} quiz questions`);
      }
    }

    console.log('🎉 Grade 3 Mathematics (Zimbabwe) seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding Grade 3 Mathematics:', error);
    throw error;
  }
}
