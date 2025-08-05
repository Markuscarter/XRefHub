# 📁 Google Drive Organization Guide for Xrefhub

## 🎯 **Recommended Folder Structure**

```
Xrefhub/
├── 01-Ad_Review_Policies/
│   ├── content_policy_guidelines.txt
│   ├── community_standards.txt
│   ├── ad_review_workflow.txt
│   └── content_moderation_rules.txt
├── 02-Paid_Partnership_Policies/
│   ├── paid_partnership_rules.txt
│   ├── commercial_content_guidelines.txt
│   ├── sponsored_post_policy.txt
│   └── advertising_disclosure_rules.txt
├── 03-General_Policies/
│   ├── general_content_policy.txt
│   ├── platform_guidelines.txt
│   └── enforcement_procedures.txt
├── 04-Entity_Knowledge_Graphs/
│   ├── industry_entities.json
│   ├── brand_entities.json
│   ├── product_entities.json
│   └── influencer_entities.json
├── 05-Relationship_Knowledge_Graphs/
│   ├── brand_partnerships.json
│   ├── industry_relationships.json
│   ├── product_categories.json
│   └── influencer_networks.json
├── 06-Rule_Knowledge_Graphs/
│   ├── policy_rules.json
│   ├── violation_patterns.json
│   ├── compliance_rules.json
│   └── decision_trees.json
├── 07-Templates/
│   ├── policy_document_template.txt
│   ├── knowledge_graph_template.json
│   └── analysis_template.json
└── 08-Examples/
    ├── example_analysis.json
    ├── example_violations.json
    └── example_compliance.json
```

## 📋 **File Naming Conventions**

### **Policy Documents**
- Use descriptive names: `paid_partnership_rules.txt`
- Include category prefix: `ad_review_workflow.txt`
- Use underscores, not spaces
- Include version if needed: `content_policy_v2.txt`

### **Knowledge Graph JSON Files**
- Use descriptive names: `industry_entities.json`
- Include type prefix: `kg_industry_entities.json`
- Use camelCase for internal structure
- Include metadata in the JSON

## 🧠 **Knowledge Graph Structure**

### **Entity Knowledge Graphs**
```json
{
  "metadata": {
    "name": "industry_entities",
    "version": "1.0.0",
    "description": "Industry classification entities",
    "created": "2024-01-01",
    "updated": "2024-01-15"
  },
  "entities": [
    {
      "id": "healthcare",
      "name": "Healthcare",
      "type": "industry",
      "subcategories": ["pharmaceuticals", "medical_devices", "healthcare_services"],
      "risk_level": "high",
      "compliance_requirements": ["FDA_approval", "medical_disclaimers"],
      "keywords": ["health", "medical", "treatment", "medicine"]
    }
  ]
}
```

### **Relationship Knowledge Graphs**
```json
{
  "metadata": {
    "name": "brand_partnerships",
    "version": "1.0.0",
    "description": "Brand partnership patterns and rules"
  },
  "relationships": [
    {
      "source": "influencer",
      "target": "brand",
      "type": "partnership",
      "rules": {
        "disclosure_required": true,
        "disclosure_format": "#ad or #sponsored",
        "content_restrictions": ["no_misleading_claims", "clear_disclosure"]
      }
    }
  ]
}
```

### **Rule Knowledge Graphs**
```json
{
  "metadata": {
    "name": "policy_rules",
    "version": "1.0.0",
    "description": "Policy decision rules and logic"
  },
  "rules": [
    {
      "id": "paid_partnership_detection",
      "name": "Paid Partnership Detection",
      "conditions": [
        "mentions_brand_or_product",
        "has_commercial_intent",
        "influencer_account"
      ],
      "actions": [
        "require_disclosure",
        "flag_for_review",
        "apply_paid_partnership_rules"
      ],
      "priority": "high"
    }
  ]
}
```

## 🔍 **AI Access Patterns**

### **Ad Review Mode**
- **Policies**: `01-Ad_Review_Policies/` + `03-General_Policies/`
- **Knowledge Graphs**: `04-Entity_Knowledge_Graphs/` + `06-Rule_Knowledge_Graphs/`
- **Focus**: Content intent, policy violations, general compliance

### **Paid Partnership Mode**
- **Policies**: `02-Paid_Partnership_Policies/` + `03-General_Policies/`
- **Knowledge Graphs**: `05-Relationship_Knowledge_Graphs/` + `06-Rule_Knowledge_Graphs/`
- **Focus**: Commercial intent, disclosure requirements, partnership patterns

## 📝 **Document Templates**

### **Policy Document Template**
```
POLICY DOCUMENT: [Document Name]
VERSION: [Version Number]
LAST UPDATED: [Date]

PURPOSE:
[Brief description of what this policy covers]

SCOPE:
[What content/activities this policy applies to]

RULES:
1. [Rule 1]
   - Details and examples
   - Enforcement criteria

2. [Rule 2]
   - Details and examples
   - Enforcement criteria

EXAMPLES:
✅ COMPLIANT:
[Example of compliant content]

❌ VIOLATION:
[Example of violating content]

ENFORCEMENT:
[How violations are handled]

REFERENCES:
[Links to related policies or external sources]
```

### **Knowledge Graph Template**
```json
{
  "metadata": {
    "name": "[graph_name]",
    "version": "1.0.0",
    "description": "[Brief description]",
    "created": "[YYYY-MM-DD]",
    "updated": "[YYYY-MM-DD]",
    "author": "[Author Name]",
    "category": "[entity|relationship|rule]"
  },
  "data": {
    // Graph-specific data structure
  },
  "usage_notes": {
    "ai_prompt_context": "[How AI should use this graph]",
    "update_frequency": "[How often this should be updated]",
    "dependencies": "[Other graphs or policies this depends on]"
  }
}
```

## 🚀 **Implementation Steps**

1. **Create Folder Structure**
   ```javascript
   // Run this in the extension console
   await createRecommendedStructure();
   ```

2. **Upload Existing Documents**
   - Move policy documents to appropriate folders
   - Convert knowledge graphs to JSON format
   - Update file names to follow conventions

3. **Test AI Access**
   - Verify documents are properly categorized
   - Test both review modes
   - Check knowledge graph parsing

4. **Monitor and Update**
   - Regular updates to policies
   - Expand knowledge graphs with new data
   - Refine categorization rules

## 🔧 **Maintenance Tips**

- **Regular Updates**: Update policies monthly, knowledge graphs weekly
- **Version Control**: Keep version numbers in metadata
- **Backup**: Export important documents regularly
- **Testing**: Test AI access after major updates
- **Documentation**: Keep this guide updated with changes 