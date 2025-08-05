# 📁 XrefHub_Policy_Analysis Folder Structure Guide

## 🎯 **Complete Folder Structure**

```
XrefHub_Policy_Analysis/
├── 01_Policy_Documents/           # Complete policy analyses (.md files)
├── 02_JSON_Extracts/             # JSON sections from each policy
├── 03_Vector_Chunks/             # Vector-ready text chunks  
├── 04_Knowledge_Graphs/          # RDF triples and relationships
├── 05_Enforcement_Workflows/     # Guidance sections for reviewers
├── 06_Master_Consolidated/       # Combined files for AI systems
└── 07_Update_Templates/          # Templates for new policy additions
```

## 📋 **Folder Purposes & File Types**

### **01_Policy_Documents/**
**Purpose**: Complete policy analyses in markdown format
**File Types**: `.md`, `.txt`
**Examples**:
- `adult_content_policy.md`
- `alcohol_advertising_policy.md`
- `paid_partnership_guidelines.md`
- `content_moderation_rules.md`

**Content Structure**:
```markdown
# Policy Title
## Overview
## Scope
## Rules
## Examples
## Enforcement
## References
```

### **02_JSON_Extracts/**
**Purpose**: Structured JSON data extracted from policy documents
**File Types**: `.json`
**Examples**:
- `adult_enforcement.json`
- `alcohol_policy_rules.json`
- `partnership_disclosure.json`

**Content Structure**:
```json
{
  "policy_name": "Adult Content Policy",
  "extracted_rules": [
    {
      "rule_id": "AC001",
      "rule_text": "No explicit sexual content",
      "enforcement_level": "strict",
      "keywords": ["explicit", "sexual", "adult"]
    }
  ]
}
```

### **03_Vector_Chunks/**
**Purpose**: Text chunks optimized for vector embeddings and AI processing
**File Types**: `.json`, `.txt`
**Examples**:
- `alcohol_policy_vectors.json`
- `partnership_guidelines_chunks.json`
- `content_moderation_vectors.json`

**Content Structure**:
```json
{
  "chunks": [
    {
      "id": "chunk_001",
      "text": "Policy text chunk for vector processing",
      "metadata": {
        "policy": "Alcohol Advertising",
        "section": "Disclosure Requirements",
        "vector_ready": true
      }
    }
  ]
}
```

### **04_Knowledge_Graphs/**
**Purpose**: RDF triples, relationships, and structured knowledge
**File Types**: `.json`, `.rdf`, `.ttl`
**Examples**:
- `brand_partnership_graph.json`
- `industry_relationships.json`
- `policy_decision_tree.json`

**Content Structure**:
```json
{
  "metadata": {
    "name": "Brand Partnership Knowledge Graph",
    "type": "relationship_graph"
  },
  "nodes": [
    {
      "id": "influencer",
      "type": "entity",
      "attributes": ["verified", "commercial_intent"]
    }
  ],
  "edges": [
    {
      "source": "influencer",
      "target": "brand",
      "type": "partnership",
      "rules": ["disclosure_required", "clear_identification"]
    }
  ]
}
```

### **05_Enforcement_Workflows/**
**Purpose**: Step-by-step guidance for content reviewers
**File Types**: `.md`, `.json`, `.txt`
**Examples**:
- `paid_partnership_review_workflow.md`
- `adult_content_enforcement.json`
- `alcohol_advertising_checklist.md`

**Content Structure**:
```markdown
# Paid Partnership Review Workflow

## Step 1: Identify Commercial Intent
- Check for brand mentions
- Look for product promotions
- Assess influencer status

## Step 2: Check Disclosure Requirements
- Verify disclosure presence
- Assess disclosure clarity
- Check disclosure placement

## Step 3: Evaluate Compliance
- Apply policy rules
- Document violations
- Recommend actions
```

### **06_Master_Consolidated/**
**Purpose**: Combined files for single-source AI access
**File Types**: `.json`, `.md`
**Examples**:
- `all_policies_consolidated.json`
- `complete_knowledge_base.json`
- `ai_ready_policy_data.json`

**Content Structure**:
```json
{
  "metadata": {
    "version": "1.0.0",
    "last_updated": "2024-01-15",
    "total_policies": 25,
    "total_rules": 150
  },
  "policies": {
    "adult_content": { /* policy data */ },
    "alcohol_advertising": { /* policy data */ },
    "paid_partnership": { /* policy data */ }
  },
  "knowledge_graphs": {
    "relationships": { /* graph data */ },
    "entities": { /* entity data */ }
  }
}
```

### **07_Update_Templates/**
**Purpose**: Templates for consistent new policy processing
**File Types**: `.md`, `.json`, `.txt`
**Examples**:
- `new_policy_template.md`
- `json_extract_template.json`
- `workflow_template.md`

## 🔧 **File Naming Conventions**

### **Policy Documents**
- Use descriptive names: `adult_content_policy.md`
- Include category: `paid_partnership_guidelines.md`
- Use underscores, not spaces
- Include version if needed: `alcohol_policy_v2.md`

### **JSON Files**
- Use descriptive names: `adult_enforcement.json`
- Include type: `alcohol_policy_vectors.json`
- Use camelCase for internal structure
- Include metadata

### **Knowledge Graphs**
- Use descriptive names: `brand_partnership_graph.json`
- Include type prefix: `kg_brand_partnership.json`
- Include version in metadata
- Use consistent structure

## 🚀 **Implementation Steps**

### **1. Create the Folder Structure**
```javascript
// Run this in the extension console
await createRecommendedStructure();
```

### **2. Upload Your Documents**
- **Policy Documents**: Upload to `01_Policy_Documents/`
- **JSON Extracts**: Create and upload to `02_JSON_Extracts/`
- **Vector Chunks**: Generate and upload to `03_Vector_Chunks/`
- **Knowledge Graphs**: Upload to `04_Knowledge_Graphs/`
- **Workflows**: Create and upload to `05_Enforcement_Workflows/`

### **3. Create Master Consolidated Files**
- Combine all policies into `06_Master_Consolidated/`
- Create comprehensive knowledge base files
- Ensure AI-ready format

### **4. Set Up Templates**
- Use `07_Update_Templates/` for new policy additions
- Maintain consistency across updates
- Version control for all changes

## 🔍 **AI Access Patterns**

### **Ad Review Mode**
- **Primary**: `01_Policy_Documents/` (general policies)
- **Supporting**: `04_Knowledge_Graphs/` (entity relationships)
- **Workflows**: `05_Enforcement_Workflows/` (review processes)
- **Master Data**: `06_Master_Consolidated/` (comprehensive access)

### **Paid Partnership Mode**
- **Primary**: `01_Policy_Documents/` (partnership policies)
- **Supporting**: `04_Knowledge_Graphs/` (partnership patterns)
- **Workflows**: `05_Enforcement_Workflows/` (compliance processes)
- **Master Data**: `06_Master_Consolidated/` (comprehensive access)

## 📊 **Maintenance & Updates**

### **For Policy Updates**
1. Use templates from `07_Update_Templates/`
2. Update files in `01_Policy_Documents/`
3. Regenerate JSON extracts in `02_JSON_Extracts/`
4. Update vector chunks in `03_Vector_Chunks/`
5. Refresh knowledge graphs in `04_Knowledge_Graphs/`
6. Update workflows in `05_Enforcement_Workflows/`
7. Rebuild master consolidated files in `06_Master_Consolidated/`

### **Version Control**
- Date all backup copies
- Maintain change logs
- Track policy evolution
- Document major updates

### **Quality Assurance**
- Test AI access after updates
- Verify policy consistency
- Check knowledge graph accuracy
- Validate workflow completeness

## 🎯 **Benefits of This Structure**

1. **Systematic AI Access**: Numbered folders ensure consistent ordering
2. **Comprehensive Coverage**: All policy aspects covered
3. **Scalable**: Easy to add new policies and knowledge
4. **Maintainable**: Clear organization and templates
5. **AI-Optimized**: Structured for optimal AI processing
6. **Version Controlled**: Easy to track changes and updates

This structure ensures your AI systems can systematically access all relevant policy data without requiring code modifications! 