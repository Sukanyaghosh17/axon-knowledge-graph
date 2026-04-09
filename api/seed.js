/**
 * Axon — Sample Data Seeder
 * Run: node seed.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Note = require('./models/Note');

dotenv.config();

const sampleNotes = [
  {
    title: 'Welcome to Axon',
    content: `# Welcome to Axon 🧠\n\nAxon is your personal knowledge graph. Use **[[wikilinks]]** to connect ideas.\n\nTry linking to [[Getting Started]] or [[Markdown Guide]] to explore the graph view.\n\nAxon supports:\n- Version control for every edit\n- Full-text search\n- Knowledge graph visualization\n- Dark and light mode`,
    tags: ['welcome', 'guide'],
  },
  {
    title: 'Getting Started',
    content: `# Getting Started\n\nThis note is linked from [[Welcome to Axon]].\n\n## Steps\n1. Create a new note using the **+** button in the sidebar\n2. Use \`[[Note Title]]\` syntax to link notes\n3. Check the **Graph View** to see connections\n4. View version history in the right panel\n\nSee also: [[Markdown Guide]]`,
    tags: ['guide', 'tutorial'],
  },
  {
    title: 'Markdown Guide',
    content: `# Markdown Guide\n\nAxon supports full **Markdown** rendering.\n\n## Headings\n# H1  ## H2  ### H3\n\n## Emphasis\n**bold**, *italic*, ~~strikethrough~~\n\n## Lists\n- Item 1\n- Item 2\n  - Nested\n\n## Code\n\`\`\`js\nconst greet = () => console.log('Hello, Axon!');\n\`\`\`\n\nLinked from: [[Getting Started]] and [[Welcome to Axon]]`,
    tags: ['markdown', 'guide', 'reference'],
  },
  {
    title: 'React Notes',
    content: `# React Notes\n\nKey concepts I've learned about React.\n\n## Hooks\n- \`useState\` — local state\n- \`useEffect\` — side effects\n- \`useContext\` — global state\n- \`useCallback\` / \`useMemo\` — performance\n\n## Patterns\n- Compound components\n- Render props\n- Custom hooks\n\nSee also: [[JavaScript Fundamentals]]`,
    tags: ['react', 'frontend', 'dev'],
  },
  {
    title: 'JavaScript Fundamentals',
    content: `# JavaScript Fundamentals\n\nCore JS concepts every developer should know.\n\n## Closures\nA closure gives access to outer scope from an inner function.\n\n## Promises & Async/Await\n\`\`\`js\nconst fetchData = async () => {\n  const res = await fetch('/api/data');\n  return res.json();\n};\n\`\`\`\n\n## Prototypes\nJS uses prototype-based inheritance.\n\nRelated: [[React Notes]]`,
    tags: ['javascript', 'dev', 'fundamentals'],
  },
  {
    title: 'Project Ideas',
    content: `# Project Ideas 💡\n\nA running list of projects to build.\n\n## In Progress\n- [[Axon Knowledge Graph]] — smart notes app\n\n## Backlog\n- CLI task manager in Go\n- Real-time chat with WebSockets\n- Portfolio site v3\n- Open-source contributions tracker`,
    tags: ['ideas', 'projects'],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Note.deleteMany({});
    console.log('🗑  Cleared existing notes');

    const created = await Note.insertMany(sampleNotes);
    console.log(`✅ Inserted ${created.length} sample notes`);

    // Resolve [[links]] between inserted notes
    const { extractLinks } = require('./utils/linkParser');
    for (const note of await Note.find()) {
      const linkedTitles = extractLinks(note.content);
      const resolved = [];
      for (const title of linkedTitles) {
        const found = await Note.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
        resolved.push({ noteId: found ? found._id : null, title });
      }
      note.links = resolved;
      await note.save();
    }
    console.log('🔗 Links resolved');
    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
