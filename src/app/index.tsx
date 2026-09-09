import { useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";

type Project = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  notes: string;
  color: string;
  targetCustomer: string;
  customerProblem: string;
  alternatives: string;
  priceRange: string;
  biggestRisk: string;
  validationNotes: string;
};
const pastelColors = [
  "#EAF4EC",
  "#EAF2FB",
  "#F3ECFA",
  "#FAF2E8",
  "#F9ECEF",
  "#EEF4E6",
];
type MarketSuggestions = {
  customer: string;
  problem: string;
  competitors: string;
  priceRange: string;
  biggestRisk: string;
  validationIdea: string;
};

async function getMarketSuggestions(
  idea: string
): Promise<MarketSuggestions> {
  const response = await fetch(
    "https://founderai-osfr.onrender.com/suggest-market",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idea }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Could not create suggestions."
    );
  }

  return data;
}
type TabName = "Overview" | "Market" | "Pricing & Risk" | "Visualize" | "Validation" | "Notes";
type VisualKind = "sketch" | "line" | "clay" | "blueprint" | "package" | "ui";

const TABS: TabName[] = ["Overview", "Market", "Pricing & Risk", "Visualize", "Validation", "Notes"];

const VISUAL_STYLES: { name: string; subtitle: string; kind: VisualKind }[] = [
  { name: "Concept Sketch", subtitle: "Hand-drawn product thinking", kind: "sketch" },
  { name: "Minimal Line Art", subtitle: "Clean, restrained outlines", kind: "line" },
  { name: "Clay Concept", subtitle: "Form-first monochrome model", kind: "clay" },
  { name: "Blueprint", subtitle: "Technical details and dimensions", kind: "blueprint" },
  { name: "Packaging Mockup", subtitle: "Simple realistic presentation", kind: "package" },
  { name: "UI Mockup", subtitle: "Wireframes for digital products", kind: "ui" },
];

function titleFromIdea(value: string) {
  const words = value.trim().replace(/\s+/g, " ").split(" ").slice(0, 5);
  const title = words.join(" ") || "Untitled Idea";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function dateLabel() {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date());
}

function AppMark() {
  return (
    <View style={styles.appMark}>
      <View style={styles.markLineA} />
      <View style={styles.markLineB} />
      <View style={styles.markDot} />
    </View>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

function EmptyState({ value, onChange, onCreate, hasProjects, onReturn }: {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  hasProjects: boolean;
  onReturn: () => void;
}) {
  const enabled = value.trim().length > 2;
  return (
    <ScrollView contentContainerStyle={styles.emptyScroll} keyboardShouldPersistTaps="handled">
      <View style={styles.emptyShell}>
        <View style={styles.topBrand}><AppMark /><Text style={styles.brandText}></Text></View>
        {hasProjects ? (
          <Pressable onPress={onReturn} style={styles.returnButton}>
            <Text style={styles.returnText}>← Return to workspace</Text>
          </Pressable>
        ) : null}

        <View style={styles.emptyContent}>
          <Text style={styles.kicker}>A private space for early ideas</Text>
          <Text style={styles.heroTitle}>Describe your idea.</Text>
          <Text style={styles.heroSubtitle}>Every venture begins as an idea. Start with yours.</Text>

          <View style={styles.composer}>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="A product, app, service, or problem you want to explore..."
              placeholderTextColor="#969A92"
              multiline
              textAlignVertical="top"
              style={styles.ideaInput}
            />
            <View style={styles.composerFooter}>
              <Text style={styles.hint}>You can refine the details later.</Text>
              <Pressable
                onPress={onCreate}
                disabled={!enabled}
                style={({ pressed }) => [styles.primaryButton, !enabled && styles.primaryDisabled, pressed && enabled && styles.pressed]}
              >
                <Text style={[styles.primaryText, !enabled && styles.primaryTextDisabled]}>Plant Your Seed</Text>
              </Pressable>
            </View>
          </View>
        </View>
        <Text style={styles.emptyFooter}>Thoughtful structure. Your decisions.</Text>
      </View>
    </ScrollView>
  );
}

function Sidebar({ projects, activeId, onSelect, onNew }: {
  projects: Project[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.topBrand}><AppMark /><Text style={styles.brandText}>Workspace</Text></View>
      <Pressable onPress={onNew} style={styles.newIdeaButton}>
        <Text style={styles.plus}>+</Text><Text style={styles.newIdeaText}>Plant New Seed</Text>
      </Pressable>
      <Text style={styles.sidebarLabel}>PROJECTS</Text>
      <ScrollView contentContainerStyle={styles.projectList}>
        {projects.map((project) => {
          const active = project.id === activeId;
          return (
            <Pressable key={project.id} onPress={() => onSelect(project.id)} style={[styles.projectItem, active && styles.projectItemActive]}>
              <View style={[styles.projectDot, active && styles.projectDotActive]} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.projectTitle, active && styles.projectTitleActive]}>{project.title}</Text>
                <Text style={styles.projectDate}>{project.createdAt}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.sidebarFooter}>Your work stays in your control.</Text>
    </View>
  );
}

function Header({ project, activeTab, setActiveTab }: { project: Project; activeTab: TabName; setActiveTab: (tab: TabName) => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.overline}>PROJECT</Text>
          <Text style={styles.projectHeading}>{project.title}</Text>
          <Text numberOfLines={2} style={styles.projectDescription}>{project.description}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Overview({ project, goMarket, goVisuals }: { project: Project; goMarket: () => void; goVisuals: () => void }) {
  return (
    <View style={styles.content}>
      <SectionHeader eyebrow="OVERVIEW" title="A promising idea, made more practical." description="Keep only the information that helps you make the next decision: customer, market, price, risk, evidence, and visual direction." />
      <View style={styles.grid}>
      <View
  style={[
    styles.card,
    styles.ideaCard,
    { backgroundColor: project.color },
  ]}
>
          <Text style={styles.cardLabel}>YOUR IDEA</Text>
          <Text style={styles.ideaQuote}>{project.description}</Text>
          <Text style={styles.editText}>Cool Idea!</Text>
        </View>
        <View style={styles.sideColumn}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>MARKET</Text>
            <Text style={styles.cardTitle}>Define who needs this first</Text>
            <Text style={styles.cardCopy}>A narrow first customer and a clear reason to switch make the idea stronger.</Text>
            <Pressable onPress={goMarket}><Text style={styles.inlineLink}>Work on the market →</Text></Pressable>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>VISUAL DIRECTION</Text>
            <Text style={styles.cardTitle}>Make the concept feel real</Text>
            <Text style={styles.cardCopy}>Plan a calm, realistic render, fine-line sketch, packaging mockup, or interface concept.</Text>
            <Pressable onPress={goVisuals}><Text style={styles.inlineLink}>Open Visualize →</Text></Pressable>
          </View>
        </View>
      </View>
      <View style={styles.nextCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>WHEN YOU FEEL READY</Text>
          <Text style={styles.nextTitle}>We can suggest a possible first customer.</Text>
          <Text style={styles.cardCopy}>Nothing is required. The app will use what you already wrote and give you an encouraging starting point.</Text>
        </View>
        <Pressable onPress={goMarket} style={styles.outlineButton}><Text style={styles.outlineText}>See gentle suggestions</Text></Pressable>
      </View>
    </View>
  );
}

function LabeledInput({ label, helper, value, onChange, placeholder }: { label: string; helper: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Text style={styles.inputHelper}>{helper}</Text>
      <TextInput value={value} onChangeText={onChange} multiline textAlignVertical="top" placeholder={placeholder} placeholderTextColor="#A0A49E" style={styles.fieldInput}/>
    </View>
  );
}

function SuggestionCard({
  label,
  title,
  helper,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  title: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <View style={styles.suggestionCard}>
      <View style={styles.suggestionTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.suggestionTitle}>{title}</Text>
        </View>
        <View style={styles.optionalPill}>
          <Text style={styles.optionalText}>Optional</Text>
        </View>
      </View>

      <Text style={styles.suggestionHelper}>{helper}</Text>

      {value.trim() && !editing ? (
        <View style={styles.suggestionAnswer}>
          <Text style={styles.suggestionAnswerLabel}>Suggested starting point</Text>
          <Text style={styles.suggestionAnswerText}>{value}</Text>
          <View style={styles.suggestionActions}>
            <Pressable onPress={() => setEditing(true)}>
              <Text style={styles.inlineLink}>Edit suggestion</Text>
            </Pressable>
            <Text style={styles.keepText}>Keep it, change it, or ignore it.</Text>
          </View>
        </View>
      ) : editing ? (
        <View>
          <TextInput
            value={value}
            onChangeText={onChange}
            multiline
            textAlignVertical="top"
            placeholder={placeholder}
            placeholderTextColor="#A0A49E"
            style={styles.fieldInput}
          />
          <Pressable onPress={() => setEditing(false)} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.waitingSuggestion}>
          <Text style={styles.waitingTitle}>Suggestion pending</Text>
          <Text style={styles.waitingCopy}>
            A starting point will appear here based on your idea.
          </Text>
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.inlineLink}>Add optional comments</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Market({ project, updateField }: { project: Project; updateField: (field: keyof Project, value: string) => void }) {
  return (
    <View style={styles.content}>
      <SectionHeader
        eyebrow="MARKET"
        title="Let’s explore who may enjoy this."
        description="There is nothing you have to complete here. As your idea grows, the assistant will organize helpful suggestions into the right sections for you."
      />

      <View style={styles.encouragementBanner}>
        <View style={styles.encouragementMark}>
          <Text style={styles.encouragementMarkText}>✓</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.encouragementTitle}>You already did the important part—you started.</Text>
          <Text style={styles.encouragementCopy}>
            We can help think through customers, competitors, and pricing in the
            background. Every suggestion is optional and can be changed later.
          </Text>
        </View>
      </View>

      <View style={styles.editorGrid}>
        <SuggestionCard
          label="POSSIBLE FIRST CUSTOMER"
          title="Who might enjoy this first?"
          helper="The assistant will suggest one clear group based on the idea—not ask you to define an entire market."
          value={project.targetCustomer}
          onChange={(value) => updateField("targetCustomer", value)}
          placeholder="A possible first customer..."
        />

        <SuggestionCard
          label="PROBLEM IT MAY HELP WITH"
          title="What could this make easier?"
          helper="This will be written in simple words and treated as a possibility, not a final answer."
          value={project.customerProblem}
          onChange={(value) => updateField("customerProblem", value)}
          placeholder="This could help people..."
        />

        <SuggestionCard
          label="CURRENT OPTIONS"
          title="How might people handle this today?"
          helper="The assistant will place competitors, substitutes, and simple workarounds here automatically."
          value={project.alternatives}
          onChange={(value) => updateField("alternatives", value)}
          placeholder="People may currently use..."
        />
      </View>

      <View style={styles.gentleCallout}>
        <Text style={styles.cardLabel}>A HELPFUL PLACE TO START</Text>
        <Text style={styles.nextTitle}>One possible customer is enough for now.</Text>
        <Text style={styles.cardCopy}>
          You can explore other groups later. For now, the app will simply offer
          a starting point based on what you have already shared.
        </Text>
      </View>
    </View>
  );    
}

function PricingRisk({ project, updateField }: { project: Project; updateField: (field: keyof Project, value: string) => void }) {
  return (
    <View style={styles.content}>
      <SectionHeader eyebrow="PRICING & RISK" title="Make the opportunity exciting—and believable." description="Define what customers may pay, what could prevent the idea from working, and what evidence is still missing." />
      <View style={styles.editorGrid}>
        <LabeledInput label="Target price or range" helper="Use a realistic range based on the customer and existing alternatives." value={project.priceRange} onChange={(value) => updateField("priceRange", value)} placeholder="Example: $65–$85 retail, positioned below premium competitors..."/>
        <LabeledInput label="Biggest risk" helper="Name the risk that would matter most to a founder or investor." value={project.biggestRisk} onChange={(value) => updateField("biggestRisk", value)} placeholder="Example: customers may like the concept but not use it often enough to justify the price..."/>
      </View>
      <View style={styles.assessmentGrid}>
        <View style={[styles.assessmentCard, { backgroundColor: "#EEF4EC" }]}><Text style={styles.cardLabel}>PRICE POSITION</Text><Text style={styles.cardTitle}>{project.priceRange || "Not defined yet"}</Text><Text style={styles.cardCopy}>Compare the price with what the customer pays now, not with what merely sounds premium.</Text></View>
        <View style={[styles.assessmentCard, { backgroundColor: "#F7EFEC" }]}><Text style={styles.cardLabel}>PRIMARY RISK</Text><Text style={styles.cardTitle}>{project.biggestRisk || "Not defined yet"}</Text><Text style={styles.cardCopy}>A clear risk does not weaken the idea. It tells you what must be tested first.</Text></View>
        <View style={[styles.assessmentCard, { backgroundColor: "#EEF1F7" }]}><Text style={styles.cardLabel}>VALUATION</Text><Text style={styles.cardTitle}>Too early for a credible number</Text><Text style={styles.cardCopy}>A serious valuation needs traction, revenue, margins, defensibility, or comparable transactions.</Text></View>
      </View>
    </View>
  );
}

function Preview({ kind }: { kind: VisualKind }) {
  if (kind === "ui") {
    return <View style={styles.preview}>{[0,1,2].map((n) => <View key={n} style={styles.phone}><View style={styles.phoneNotch}/><View style={styles.uiShort}/><View style={styles.uiBlock}/><View style={styles.uiLine}/><View style={styles.uiLine}/><View style={styles.uiButton}/></View>)}</View>;
  }
  if (kind === "blueprint") {
    return <View style={[styles.preview, styles.blueprint]}><View style={styles.blueBottle}><View style={styles.blueCap}/></View><Text style={styles.measureTop}>52 mm</Text><Text style={styles.measureSide}>128 mm</Text></View>;
  }
  if (kind === "clay") {
    return <View style={styles.preview}><View style={styles.clayShadow}/><View style={styles.clay}><View style={styles.clayInset}/><Text style={styles.clayWord}>FORM</Text></View><View style={styles.claySide}/></View>;
  }
  if (kind === "package") {
    return <View style={styles.preview}><View style={styles.box}><Text style={styles.packBrand}>STUDIO</Text><View style={styles.packRule}/><Text style={styles.packSmall}>PRODUCT CONCEPT</Text></View><View style={styles.tube}><Text style={styles.packBrand}>STUDIO</Text><Text style={styles.packSmall}>CONCEPT 01</Text><View style={styles.tubeCap}/></View></View>;
  }
  return (
    <View style={styles.preview}>
      <View style={[styles.bottle, kind === "sketch" && styles.sketchBottle]}>
        <View style={styles.cap}/><Text style={styles.bottleBrand}>{kind === "sketch" ? "WAVE" : "PURE"}</Text><View style={styles.bottleRule}/><Text style={styles.bottleSmall}>CONCEPT</Text>
      </View>
      {kind === "sketch" ? <><Text style={[styles.annotation, { right: 18, top: 48 }]}>easy grip</Text><Text style={[styles.annotation, { left: 18, bottom: 34 }]}>matte finish</Text></> : <View style={styles.secondBottle}/>} 
    </View>
  );
}

async function generateVisuals(brief: string): Promise<string[]> {
  const response = await fetch("https://founderai-osfr.onrender.com/generate-visual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not generate images.");
  return data.images;
}

function Visualize() {
  const [brief, setBrief] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!brief.trim()) return;
    setLoading(true);
    setImages([]);
    try {
      const results = await generateVisuals(brief);
      setImages(results);
    } catch (error) {
      console.error("Visual generation error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.content}>
      <SectionHeader eyebrow="VISUALIZE" title="Turn a rough idea into a calm, realistic design." description="Describe your concept and get a set of professional, photorealistic product renders — not cartoons or exaggerated AI art." />

      <View style={styles.briefCard}>
        <Text style={styles.cardLabel}>DESIGN BRIEF</Text>
        <Text style={styles.cardTitle}>Describe the concept</Text>
        <Text style={styles.cardCopy}>Add the form, material, mood, colour, or setting you imagine. Keep it rough—the concept can evolve.</Text>
        <TextInput
          value={brief}
          onChangeText={setBrief}
          multiline
          textAlignVertical="top"
          placeholder="Example: matcha ice cube tray, minimal soft-touch silicone, pale green, natural kitchen countertop setting..."
          placeholderTextColor="#969A92"
          style={styles.briefInput}
        />
      </View>

      <View style={styles.generateBar}>
        <View><Text style={styles.cardLabel}>READY WHEN YOU ARE</Text><Text style={styles.generateTitle}>{loading ? "Generating concepts..." : "Create Design Concepts"}</Text></View>
        <Pressable onPress={handleGenerate} disabled={loading || !brief.trim()} style={styles.primaryButton}>
          <Text style={styles.primaryText}>{loading ? "Generating..." : "Generate"}</Text>
        </Pressable>
      </View>

      {images.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 24 }}>
          {images.map((uri, index) => (
            <View key={index} style={{ flexGrow: 1, flexBasis: 280, maxWidth: 380, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#E0E1DB" }}>
              <Image source={{ uri }} style={{ width: "100%", height: 280 }} resizeMode="cover" />
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.disclaimer}>Concepts are AI-generated starting points meant to spark direction, not final production designs.</Text>
    </View>
  );
}

function Validation({
  project,
  updateField,
}: {
  project: Project;
  updateField: (field: keyof Project, value: string) => void;
}) {
  return (
    <View style={styles.content}>
      <SectionHeader
        eyebrow="VALIDATION"
        title="Test the idea without overbuilding."
        description="Start with one simple test that helps you learn whether people genuinely care."
      />
      <SuggestionCard
        label="FIRST TEST"
        title="What could you try first?"
        helper="A practical starting point based on your idea."
        value={project.validationNotes}
        onChange={(value) => updateField("validationNotes", value)}
        placeholder="Add a possible test..."
      />
    </View>
  );
}

function Notes({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return (
    <View style={styles.content}>
      <SectionHeader eyebrow="NOTES" title="A quiet place to think." description="Capture your own decisions, questions, research, and observations." />
      <View style={styles.notesCard}><TextInput value={value} onChangeText={onChange} multiline textAlignVertical="top" placeholder="Write freely..." placeholderTextColor="#A2A59F" style={styles.notesInput}/><View style={styles.notesFooter}><Text style={styles.disclaimer}>Saved in this session</Text><Text style={styles.disclaimer}>{words} words</Text></View></View>
    </View>
  );
}

export default function Index() {
  const { width } = useWindowDimensions();
  const compact = width < 960;
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState("");
  const [activeTab, setActiveTab] = useState<TabName>("Overview");
  const [idea, setIdea] = useState("");
  const [showNew, setShowNew] = useState(true); const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeProject = useMemo(() => projects.find((p) => p.id === activeId), [projects, activeId]);

  async function createProject() {
    const description = idea.trim();

    if (description.length < 3) return;

    const projectId = String(Date.now());

    const project: Project = {
      id: projectId,
      title: titleFromIdea(description),
      description,
      createdAt: dateLabel(),
      notes: "",
      color:
        pastelColors[
          Math.floor(Math.random() * pastelColors.length)
        ],
      targetCustomer: "",
      customerProblem: "",
      alternatives: "",
      priceRange: "",
      biggestRisk: "",
      validationNotes: "",
    };

    setProjects((current) => [project, ...current]);
    setActiveId(projectId);
    setActiveTab("Overview");
    setIdea("");
    setShowNew(false);

    try {
      const suggestions = await getMarketSuggestions(description);

      setProjects((current) =>
        current.map((item) =>
          item.id === projectId
            ? {
                ...item,
                targetCustomer: suggestions.customer || "",
                customerProblem: suggestions.problem || "",
                alternatives: suggestions.competitors || "",
                priceRange: suggestions.priceRange || "",
                biggestRisk: suggestions.biggestRisk || "",
                validationNotes: suggestions.validationIdea || "",
              }
            : item
        )
      );

      setActiveTab("Market");
    } catch (error) {
      console.error("AI suggestion error:", error);
    }
  }

  function updateField(field: keyof Project, value: string) {
    setProjects((current) => current.map((p) => p.id === activeId ? { ...p, [field]: value } : p));
  }

  if (projects.length === 0 || showNew) {
    return <SafeAreaView style={styles.safe}><EmptyState value={idea} onChange={setIdea} onCreate={createProject} hasProjects={projects.length > 0} onReturn={() => setShowNew(false)}/></SafeAreaView>;
  }
  if (!activeProject) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        {!compact ? <Sidebar projects={projects} activeId={activeId} onSelect={(id) => { setActiveId(id); setActiveTab("Overview"); }} onNew={() => setShowNew(true)}/> : null}
        <View style={styles.main}>
        {compact ? (
  <View style={styles.mobileBar}>
    <Pressable onPress={() => setSidebarOpen(true)}>
      <Text style={{ fontSize: 22 }}>☰</Text>
    </Pressable>
    <Pressable onPress={() => setShowNew(true)} style={styles.mobileNew}><Text style={styles.smallButtonText}>+ New idea</Text></Pressable>
  </View>
) : null}
{compact && sidebarOpen ? (
  <Pressable onPress={() => setSidebarOpen(false)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 10 }}>
    <Pressable onPress={(e) => e.stopPropagation()} style={{ width: 268, height: "100%", backgroundColor: "#ECEDE7" }}>
      <Sidebar projects={projects} activeId={activeId} onSelect={(id) => { setActiveId(id); setActiveTab("Overview"); setSidebarOpen(false); }} onNew={() => { setShowNew(true); setSidebarOpen(false); }}/>
    </Pressable>
  </Pressable>
) : null}
          <Header project={activeProject} activeTab={activeTab} setActiveTab={setActiveTab}/>
          <ScrollView contentContainerStyle={styles.workspaceScroll} keyboardShouldPersistTaps="handled">
            {activeTab === "Overview" && <Overview project={activeProject} goMarket={() => setActiveTab("Market")} goVisuals={() => setActiveTab("Visualize")}/>} 
            {activeTab === "Market" && <Market project={activeProject} updateField={updateField}/>}
            {activeTab === "Pricing & Risk" && <PricingRisk project={activeProject} updateField={updateField}/>}
            {activeTab === "Visualize" && <Visualize/>}
            {activeTab === "Validation" && (
              <Validation
                project={activeProject}
                updateField={updateField}
              />
            )}
            {activeTab === "Notes" && <Notes value={activeProject.notes} onChange={(value) => updateField("notes", value)}/>} 
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F5F1" },
  shell: { flex: 1, flexDirection: "row" },
  main: { flex: 1, backgroundColor: "#F8F5EF", width: "100%" },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  appMark: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#24382F", position: "relative", overflow: "hidden" },
  markLineA: { position: "absolute", width: 12, height: 2, backgroundColor: "#EEF2ED", top: 9, left: 8, transform: [{ rotate: "-25deg" }] },
  markLineB: { position: "absolute", width: 10, height: 2, backgroundColor: "#EEF2ED", top: 16, left: 10, transform: [{ rotate: "28deg" }] },
  markDot: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: "#B8CCB7", top: 12, left: 12 },
  topBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandText: { fontSize: 15, fontWeight: "700", color: "#29352E" },

  emptyScroll: { flexGrow: 1 },
  emptyShell: { flex: 1, minHeight: 720, padding: 18 },
  emptyContent: { width: "100%", maxWidth: 820, alignSelf: "center", marginTop: 130 },
  kicker: { fontSize: 12, fontWeight: "700", letterSpacing: 1.3, color: "#7B837D", marginBottom: 18 },
  heroTitle: { fontSize: 54, lineHeight: 62, color: "#1F2A24", fontWeight: "600", letterSpacing: -1.8 },
  heroSubtitle: { fontSize: 18, lineHeight: 28, color: "#747B76", marginTop: 14, marginBottom: 36 },
  composer: { backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#E2E2DC", padding: 10, ...(Platform.OS === "web" ? { boxShadow: "0 18px 55px rgba(40,51,44,0.07)" } as any : {}) },
  ideaInput: { minHeight: 190, paddingHorizontal: 22, paddingTop: 20, color: "#253129", fontSize: 19, lineHeight: 29, ...(Platform.OS === "web" ? { outlineStyle: "none" } as any : {}) },
  composerFooter: { borderTopWidth: 1, borderTopColor: "#EFEFEA", paddingTop: 12, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  hint: { flex: 1, fontSize: 13, color: "#8A908B" },
  primaryButton: { minHeight: 48, paddingHorizontal: 22, borderRadius: 14, backgroundColor: "#24382F", justifyContent: "center", alignItems: "center" },
  primaryDisabled: { backgroundColor: "#E7E8E4" },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  primaryTextDisabled: { color: "#A2A69F" },
  emptyFooter: { marginTop: "auto", alignSelf: "center", color: "#A0A59F", fontSize: 12, paddingTop: 40 },
  returnButton: { position: "absolute", top: 22, right: 24, padding: 10 },
  returnText: { color: "#536159", fontSize: 13, fontWeight: "600" },

  sidebar: { width: 268, backgroundColor: "#ECEDE7", borderRightWidth: 1, borderRightColor: "#DEDFD8", paddingHorizontal: 18, paddingTop: 24 },
  newIdeaButton: { height: 46, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDDED8", marginTop: 30, marginBottom: 32, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9 },
  plus: { fontSize: 20, color: "#34443A" },
  newIdeaText: { fontSize: 13, color: "#34443A", fontWeight: "700" },
  sidebarLabel: { fontSize: 10, letterSpacing: 1.3, fontWeight: "700", color: "#8D938E", paddingHorizontal: 7, marginBottom: 10 },
  projectList: { paddingBottom: 20, gap: 5 },
  projectItem: { minHeight: 58, borderRadius: 13, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  projectItemActive: { backgroundColor: "#DDE4DC" },
  projectDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: "#A1AAA3" },
  projectDotActive: { backgroundColor: "#375242", borderColor: "#375242" },
  projectTitle: { color: "#4E5751", fontSize: 13, fontWeight: "600" },
  projectTitleActive: { color: "#23342A", fontWeight: "700" },
  projectDate: { color: "#969B97", fontSize: 10, marginTop: 4 },
  sidebarFooter: { marginTop: "auto", paddingVertical: 22, color: "#8C928E", fontSize: 11, borderTopWidth: 1, borderTopColor: "#DADCD5" },

  mobileBar: { height: 62, borderBottomWidth: 1, borderBottomColor: "#E3E3DE", paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mobileNew: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#D9DBD5", backgroundColor: "#FFFFFF" },
  header: { paddingHorizontal: 20, paddingTop: 32, borderBottomWidth: 1, borderBottomColor: "#E5E5DF" },
  headerRow: { flexDirection: "row", gap: 24, justifyContent: "space-between" },
  overline: { fontSize: 10, color: "#929892", fontWeight: "700", letterSpacing: 1.4, marginBottom: 9 },
  projectHeading: { fontSize: 31, lineHeight: 38, color: "#202C25", fontWeight: "600", letterSpacing: -0.7 },
  projectDescription: { fontSize: 14, lineHeight: 21, color: "#757C77", marginTop: 8, maxWidth: 680 },
  statusPill: { marginTop: 18, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#DBDDD7", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 7, height: 34 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#92A993" },
  statusText: { color: "#59645C", fontSize: 11, fontWeight: "600" },
  tabs: { gap: 30, paddingTop: 30 },
  tabButton: { paddingBottom: 15, position: "relative" },
  tabText: { color: "#8B918C", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#25342B", fontWeight: "700" },
  tabUnderline: { height: 2, backgroundColor: "#2D4738", position: "absolute", bottom: 0, left: 0, right: 0 },
  workspaceScroll: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 80 },
  content: { width: "100%", maxWidth: 1180, alignSelf: "center" },
  sectionHeader: { maxWidth: 720, marginBottom: 34 },
  eyebrow: { color: "#899089", fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12 },
  sectionTitle: { color: "#213028", fontSize: 30, lineHeight: 38, fontWeight: "600", letterSpacing: -0.7 },
  sectionDescription: { color: "#767D78", fontSize: 15, lineHeight: 24, marginTop: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  card: { flex: 1, minWidth: 280, borderRadius: 22, borderWidth: 1, borderColor: "#E2E2DC", backgroundColor: "#FFFFFF", padding: 24 },
  ideaCard: { flex: 1.35, minHeight: 320, justifyContent: "space-between" },
  sideColumn: { flex: 1, minWidth: 0, gap: 18 },
  cardLabel: { color: "#8A918B", fontSize: 10, fontWeight: "700", letterSpacing: 1.3 },
  ideaQuote: { color: "#253229", fontSize: 25, lineHeight: 36, fontWeight: "500", marginVertical: 34 },
  editText: { color: "#4F6257", fontSize: 12, fontWeight: "700", textDecorationLine: "underline" },
  cardTitle: { color: "#26342C", fontSize: 17, fontWeight: "700", marginTop: 17 },
  cardCopy: { color: "#7B817C", fontSize: 13, lineHeight: 20, marginTop: 7 },
  inlineLink: { color: "#40574A", fontSize: 12, fontWeight: "700", marginTop: 18 },
  nextCard: { marginTop: 18, borderRadius: 22, borderWidth: 1, borderColor: "#D9DED7", backgroundColor: "#EDF1EB", padding: 26, flexDirection: "row", alignItems: "center", gap: 22 },
  nextTitle: { color: "#25352B", fontSize: 19, fontWeight: "700", marginTop: 13 },
  outlineButton: { minHeight: 43, paddingHorizontal: 17, borderRadius: 12, borderWidth: 1, borderColor: "#BFC8C0", backgroundColor: "rgba(255,255,255,0.55)", justifyContent: "center" },
  outlineText: { color: "#34483B", fontSize: 12, fontWeight: "700" },

  emptyAssessment: { minHeight: 310, borderWidth: 1, borderStyle: "dashed", borderColor: "#D1D5CE", borderRadius: 22, backgroundColor: "#FBFBF8", alignItems: "center", justifyContent: "center", padding: 34 },
  assessmentIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: "#E7EDE6", marginBottom: 18, alignItems: "center", justifyContent: "center", gap: 6 },
  iconLineA: { width: 20, height: 2, backgroundColor: "#52675A" },
  iconLineB: { width: 14, height: 2, backgroundColor: "#52675A" },
  emptyAssessmentTitle: { color: "#26342C", fontSize: 20, fontWeight: "700" },
  emptyAssessmentCopy: { maxWidth: 560, textAlign: "center", color: "#7A817C", fontSize: 14, lineHeight: 22, marginTop: 10, marginBottom: 24 },
  disclaimer: { color: "#9A9F9A", fontSize: 11, lineHeight: 17, marginTop: 15, textAlign: "center" },
  assessmentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 18 },
  assessmentCard: { flexGrow: 1, flexBasis: 220, minHeight: 125, borderRadius: 18, borderWidth: 1, borderColor: "#E3E3DD", backgroundColor: "#FFFFFF", padding: 20 },
  placeholderText: { color: "#9A9F9A", fontSize: 13, lineHeight: 20, marginTop: 17 },

  briefCard: { borderRadius: 22, borderWidth: 1, borderColor: "#DFE0DA", backgroundColor: "#FFFFFF", padding: 24, marginBottom: 34 },
  briefInput: { minHeight: 125, borderRadius: 16, borderWidth: 1, borderColor: "#DEE0DA", backgroundColor: "#FAFAF7", marginTop: 20, padding: 17, color: "#2A352F", fontSize: 14, lineHeight: 22, ...(Platform.OS === "web" ? { outlineStyle: "none" } as any : {}) },
  visualLabel: { color: "#8A918B", fontSize: 10, fontWeight: "700", letterSpacing: 1.4, marginBottom: 14 },
  visualGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  visualCard: { flexGrow: 1, flexBasis: 280, maxWidth: "100%", minWidth: 0, borderRadius: 20, borderWidth: 1, borderColor: "#E0E1DB", backgroundColor: "#FFFFFF", overflow: "hidden" },
  visualCardActive: { borderColor: "#708476", borderWidth: 1.5 },
  visualHeading: { paddingHorizontal: 19, paddingTop: 18, paddingBottom: 15 },
  visualTitle: { color: "#27342D", fontSize: 15, fontWeight: "700" },
  visualSubtitle: { color: "#858B86", fontSize: 11, marginTop: 4 },
  preview: { height: 220, marginHorizontal: 11, borderRadius: 14, backgroundColor: "#F4F4F0", position: "relative", alignItems: "center", justifyContent: "center", overflow: "hidden", flexDirection: "row", gap: 10 },
  bottle: { width: 98, height: 155, borderRadius: 17, borderWidth: 1.5, borderColor: "#3C4640", backgroundColor: "#FBFBF8", alignItems: "center", justifyContent: "center" },
  sketchBottle: { borderStyle: "dashed", transform: [{ rotate: "-1deg" }] },
  cap: { position: "absolute", top: 0, width: 70, height: 24, borderBottomWidth: 1.5, borderBottomColor: "#3C4640" },
  bottleBrand: { color: "#303A34", fontSize: 16, fontWeight: "700", letterSpacing: 1.6 },
  bottleRule: { width: 28, height: 1, backgroundColor: "#59625C", marginVertical: 9 },
  bottleSmall: { color: "#727A75", fontSize: 7, letterSpacing: 1.2 },
  annotation: { position: "absolute", color: "#666F69", fontSize: 9, fontStyle: "italic" },
  secondBottle: { position: "absolute", right: 47, bottom: 34, width: 44, height: 108, borderWidth: 1, borderColor: "#6D756F", borderRadius: 12 },
  blueprint: { backgroundColor: "#17324A" },
  blueBottle: { width: 76, height: 140, borderWidth: 1.5, borderColor: "#E2EDF4", borderRadius: 13, alignItems: "center" },
  blueCap: { width: 54, height: 22, borderBottomWidth: 1.5, borderBottomColor: "#E2EDF4" },
  measureTop: { position: "absolute", top: 14, color: "#D7E7F0", fontSize: 8 },
  measureSide: { position: "absolute", left: 24, color: "#D7E7F0", fontSize: 8, transform: [{ rotate: "-90deg" }] },
  clayShadow: { position: "absolute", bottom: 31, width: 140, height: 22, borderRadius: 50, backgroundColor: "#D8D6D0" },
  clay: { width: 94, height: 150, borderRadius: 32, backgroundColor: "#E1DED6", borderWidth: 1, borderColor: "#CBC8C1", justifyContent: "center", alignItems: "center" },
  clayInset: { position: "absolute", top: 13, width: 29, height: 9, borderRadius: 9, backgroundColor: "#D1CEC6" },
  clayWord: { color: "#B2AEA5", fontSize: 15, fontWeight: "700", letterSpacing: 1.5 },
  claySide: { width: 34, height: 114, borderRadius: 17, backgroundColor: "#D8D5CD", borderWidth: 1, borderColor: "#C6C3BC" },
  box: { width: 91, height: 150, backgroundColor: "#E9E5DD", borderWidth: 1, borderColor: "#D8D3CB", justifyContent: "center", alignItems: "center" },
  tube: { width: 70, height: 135, borderRadius: 11, backgroundColor: "#F1EEE8", borderWidth: 1, borderColor: "#D8D3CB", justifyContent: "center", alignItems: "center", position: "relative" },
  tubeCap: { position: "absolute", bottom: 0, left: 8, right: 8, height: 22, borderTopWidth: 1, borderTopColor: "#D2CEC6" },
  packBrand: { color: "#555B57", fontSize: 12, letterSpacing: 1.5 },
  packRule: { width: 28, height: 1, backgroundColor: "#939892", marginVertical: 11 },
  packSmall: { color: "#858A85", fontSize: 6, letterSpacing: 0.7, marginTop: 7 },
  phone: { width: 63, height: 145, borderRadius: 12, borderWidth: 1.2, borderColor: "#555F59", backgroundColor: "#FAFAF7", paddingHorizontal: 7, paddingTop: 14 },
  phoneNotch: { position: "absolute", top: 5, alignSelf: "center", width: 16, height: 2, borderRadius: 3, backgroundColor: "#7C847F" },
  uiShort: { height: 3, width: "42%", borderRadius: 2, backgroundColor: "#B4B9B5", marginBottom: 9 },
  uiBlock: { height: 38, borderRadius: 5, backgroundColor: "#E3E5E1", borderWidth: 1, borderColor: "#C9CDC8", marginBottom: 9 },
  uiLine: { height: 3, borderRadius: 2, backgroundColor: "#D0D4D0", marginBottom: 6 },
  uiButton: { height: 13, borderRadius: 5, backgroundColor: "#56675C", marginTop: "auto", marginBottom: 7 },
  visualFooter: { minHeight: 48, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  visualFooterText: { color: "#707771", fontSize: 11, fontWeight: "600" },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1, borderColor: "#B7BCB7", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: "#4D6657" },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#4D6657" },
  generateBar: { marginTop: 20, borderRadius: 18, borderWidth: 1, borderColor: "#DCE0DA", backgroundColor: "#EEF1EC", padding: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18 },
  generateTitle: { color: "#2A392F", fontSize: 16, fontWeight: "700", marginTop: 5 },

  validationList: { borderTopWidth: 1, borderTopColor: "#DDDED8" },
  validationRow: { minHeight: 118, borderBottomWidth: 1, borderBottomColor: "#DDDED8", flexDirection: "row", alignItems: "center", gap: 22, paddingVertical: 22 },
  numberBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#ECEFEA", alignItems: "center", justifyContent: "center" },
  numberText: { color: "#526159", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  validationTitle: { color: "#27352D", fontSize: 16, fontWeight: "700" },
  smallButton: { minHeight: 39, paddingHorizontal: 14, borderRadius: 11, borderWidth: 1, borderColor: "#D1D5CF", backgroundColor: "#FFFFFF", justifyContent: "center" },
  smallButtonText: { color: "#536159", fontSize: 11, fontWeight: "700" },

  notesCard: { borderRadius: 22, borderWidth: 1, borderColor: "#DFE0DA", backgroundColor: "#FFFFFF", padding: 10 },
  notesInput: { minHeight: 430, padding: 20, color: "#28342D", fontSize: 16, lineHeight: 27, ...(Platform.OS === "web" ? { outlineStyle: "none" } as any : {}) },
  notesFooter: { minHeight: 46, borderTopWidth: 1, borderTopColor: "#EFEFEA", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  editorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  inputGroup: { flexGrow: 1, flexBasis: 280, maxWidth: "100%", borderRadius: 20, borderWidth: 1, borderColor: "#E0E1DB", backgroundColor: "#FFFFFF", padding: 22 },
  inputLabel: { color: "#2E3C33", fontSize: 15, fontWeight: "700" },
  inputHelper: { color: "#858B86", fontSize: 12, lineHeight: 18, marginTop: 6 },
  fieldInput: { minHeight: 140, borderRadius: 14, borderWidth: 1, borderColor: "#E0E1DC", backgroundColor: "#FAFAF7", marginTop: 16, padding: 15, color: "#2A352F", fontSize: 14, lineHeight: 22, ...(Platform.OS === "web" ? { outlineStyle: "none" } as any : {}) },
  suggestionCard: { flexGrow: 1, flexBasis: 280, maxWidth: "100%", borderRadius: 20, borderWidth: 1, borderColor: "#E0E1DB", backgroundColor: "#FFFFFF", padding: 22 },
  suggestionTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  suggestionTitle: { color: "#2E3C33", fontSize: 18, lineHeight: 25, fontWeight: "700", marginTop: 10 },
  suggestionHelper: { color: "#858B86", fontSize: 12, lineHeight: 19, marginTop: 8 },
  optionalPill: { borderRadius: 999, backgroundColor: "#F1F2EE", borderWidth: 1, borderColor: "#E1E3DD", paddingHorizontal: 10, paddingVertical: 6 },
  optionalText: { color: "#7D847F", fontSize: 10, fontWeight: "700" },
  suggestionAnswer: { marginTop: 18, borderRadius: 15, backgroundColor: "#F3F6F1", borderWidth: 1, borderColor: "#E0E6DE", padding: 17 },
  suggestionAnswerLabel: { color: "#748078", fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  suggestionAnswerText: { color: "#2D3B32", fontSize: 14, lineHeight: 22, marginTop: 8 },
  suggestionActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 },
  keepText: { color: "#929893", fontSize: 10, marginTop: 18 },
  waitingSuggestion: { marginTop: 18, borderRadius: 15, backgroundColor: "#FAFAF7", borderWidth: 1, borderStyle: "dashed", borderColor: "#D8DBD5", padding: 17 },
  waitingTitle: { color: "#405047", fontSize: 14, fontWeight: "700" },
  waitingCopy: { color: "#858B86", fontSize: 12, lineHeight: 19, marginTop: 7 },
  doneButton: { alignSelf: "flex-start", marginTop: 10, borderRadius: 10, backgroundColor: "#24382F", paddingHorizontal: 15, paddingVertical: 10 },
  doneButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  encouragementBanner: { borderRadius: 20, borderWidth: 1, borderColor: "#DDE5DC", backgroundColor: "#EEF4ED", padding: 22, flexDirection: "row", alignItems: "flex-start", gap: 15, marginBottom: 20 },
  encouragementMark: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#DCE9DC", alignItems: "center", justifyContent: "center" },
  encouragementMarkText: { color: "#3E5A48", fontSize: 16, fontWeight: "700" },
  encouragementTitle: { color: "#2A3B31", fontSize: 16, fontWeight: "700" },
  encouragementCopy: { color: "#727B75", fontSize: 13, lineHeight: 20, marginTop: 6 },
  gentleCallout: { marginTop: 20, borderRadius: 20, borderWidth: 1, borderColor: "#DFE1DB", backgroundColor: "#F4F1EA", padding: 24 },
  marketCallout: { marginTop: 20, borderRadius: 20, borderWidth: 1, borderColor: "#DCE2DA", backgroundColor: "#EEF3ED", padding: 24 },
  uploadCard: { borderRadius: 22, borderWidth: 1, borderStyle: "dashed", borderColor: "#C9CEC8", backgroundColor: "#FBFBF8", padding: 24, flexDirection: "row", alignItems: "center", gap: 18, marginBottom: 20 },
});
