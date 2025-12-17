const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * EXACT conversion of Python process_psychometric_data function
 */
function processPsychometricData(webhookData) {
    // 1) Extract the main data object - handle different possible structures
    let body = null;
    let data = null;
    
    if (webhookData.body && webhookData.body.data) {
        // Structure: { body: { data: {...} } }
        body = webhookData.body;
        data = webhookData.body.data;
    } else if (webhookData.data) {
        // Structure: { data: {...} }
        body = webhookData;
        data = webhookData.data;
    } else {
        // Fallback: use the entire object as data
        body = webhookData;
        data = webhookData;
    }
    
    // Validate that we have the essential data
    if (!data) {
        throw new Error('No assessment data found in webhook payload');
    }
    
    if (!data.student_name || !data.student_email) {
        throw new Error('Missing student information (name or email) in the data');
    }
    
    // 2) Candidate information
    const candidate = {
        id: data.id || 'Unknown',
        name: data.student_name,
        email: data.student_email,
        created_at: data.created_at || new Date().toISOString()
    };
    
    // 3) Domain scores with proper fallbacks
    const detailedScores = data.detailed_scores || {};
    const domainScores = {
        executing: parseFloat(detailedScores.executing || data.executing_score || 0),
        influencing: parseFloat(detailedScores.influencing || data.influencing_score || 0),
        relationship_building: parseFloat(detailedScores.relationshipBuilding || data.relationship_building_score || 0),
        strategic_thinking: parseFloat(detailedScores.strategicThinking || data.strategic_thinking_score || 0),
        primary_talent_domain: data.primary_talent_domain || 'Not Specified'
    };
    
    // 4) Process subdomain/strength scores
    let subdomains = detailedScores.subdomains || {};
    
    // If no subdomains found, create a fallback structure
    if (!subdomains || Object.keys(subdomains).length === 0) {
        console.warn('Warning: No subdomain scores found. Using domain scores as fallback.');
        subdomains = {
            'Analytical': domainScores.strategic_thinking,
            'Relator': domainScores.relationship_building,
            'Communication': domainScores.influencing,
            'Achiever': domainScores.executing
        };
    }
    
    // Theme → Domain mapping (CliftonStrengths style)
    const domainMap = {
        // Executing Domain
        'Achiever': "Executing",
        'Arranger': "Executing", 
        'Belief': "Executing",
        'Consistency': "Executing",
        'Deliberative': "Executing",
        'Discipline': "Executing",
        'Focus': "Executing",
        'Responsibility': "Executing",
        'Restorative': "Executing",

        // Influencing Domain
        'Activator': "Influencing",
        'Command': "Influencing",
        'Communication': "Influencing",
        'Competition': "Influencing",
        'Maximizer': "Influencing",
        'SelfAssurance': "Influencing",
        'Significance': "Influencing",
        'Woo': "Influencing",

        // Relationship Building Domain
        'Adaptability': "Relationship Building",
        'Connectedness': "Relationship Building",
        'Developer': "Relationship Building",
        'Empathy': "Relationship Building",
        'Harmony': "Relationship Building",
        'Includer': "Relationship Building",
        'Individualization': "Relationship Building",
        'Positivity': "Relationship Building",
        'Relator': "Relationship Building",

        // Strategic Thinking Domain
        'Analytical': "Strategic Thinking",
        'Context': "Strategic Thinking",
        'Futuristic': "Strategic Thinking",
        'Ideation': "Strategic Thinking",
        'Input': "Strategic Thinking",
        'Intellection': "Strategic Thinking",
        'Learner': "Strategic Thinking",
        'Strategic': "Strategic Thinking"
    };
    
    // Convert strength scores
    const strengthScores = {};
    for (const [name, rawScore] of Object.entries(subdomains)) {
        strengthScores[name] = parseFloat(rawScore) || 0.0;
    }
    
    // Create list of all themes with scores and domains
    const allThemes = [];
    for (const [name, score] of Object.entries(strengthScores)) {
        allThemes.push({
            name: name,
            score: score,
            domain: domainMap[name] || "Unknown"
        });
    }
    
    // Sort by score (descending), then alphabetically
    allThemes.sort((a, b) => {
        if (a.score !== b.score) {
            return b.score - a.score;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Get top 5
    const top5 = allThemes.slice(0, 5);
    
    // Generate all possible pairs from top 5
    const top5Pairs = [];
    for (let i = 0; i < top5.length; i++) {
        for (let j = i + 1; j < top5.length; j++) {
            top5Pairs.push({
                themeA: top5[i],
                themeB: top5[j],
                pairLabel: `${top5[i].name} + ${top5[j].name}`
            });
        }
    }
    
    const processedData = {
        candidate: candidate,
        domainScores: domainScores,
        strength_scores: strengthScores,
        allThemes: allThemes,
        top5: top5,
        top5Pairs: top5Pairs,
        responses: data.responses,
        raw: body
    };
    
    return processedData;
}

/**
 * EXACT conversion of Python get_elaborate_theme_description function
 */
function getElaborateThemeDescription(themeName) {
    const themeData = {
        'Ideation': {
            'description': 'You are fascinated by ideas and enjoy making connections between seemingly disparate phenomena. You thrive on creativity and innovation, constantly generating new concepts and possibilities.',
            'elaborate_description': 'Your Ideation strength means you are naturally curious and imaginative. You see the world as a place full of possibilities and connections that others might miss. You enjoy brainstorming sessions and can often come up with innovative solutions to complex problems. This strength helps you think outside the box and approach challenges from unique angles.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Natural curiosity and imagination',
                'Ability to see patterns and connections',
                'Comfort with abstract thinking',
                'Enjoyment of brainstorming and idea generation',
                'Innovative problem-solving approach'
            ],
            'personal_life': [
                'Nurture curiosity by exploring new hobbies or topics, helping you stay intellectually engaged and stimulated',
                'Use your innovative mindset to brainstorm creative solutions for everyday problems at home and in personal relationships',
                'Reframe challenges as opportunities for growth and development, seeing obstacles as chances to innovate',
                'Keep an idea journal to capture your creative thoughts and insights as they occur throughout the day',
                'Engage in activities that stimulate your imagination, such as reading diverse genres, visiting museums, or learning new skills'
            ],
            'education': [
                'Approach studies with an open mind, actively seeking out diverse perspectives and unconventional ideas to broaden your understanding',
                'Generate multiple approaches when tackling complex academic problems, allowing you to find the most innovative solutions',
                'Use your creativity to develop unique and memorable solutions for group projects, presentations, and research papers',
                'Connect concepts across different disciplines to create integrated knowledge and novel insights',
                'Participate in debates and discussions where you can explore and develop your ideas through dialogue with others'
            ],
            'career': [
                'Contribute innovative ideas during brainstorming sessions, team meetings, or problem-solving discussions, bringing fresh perspectives',
                'Develop creative strategies when leading or managing projects, finding new ways to achieve objectives efficiently',
                'Approach problems from multiple angles to find the most effective and innovative solutions that others might overlook',
                'Volunteer for projects that require creative thinking and innovation, positioning yourself as a valuable idea generator',
                'Create systems for capturing and developing ideas that can benefit your organization long-term'
            ],
            'development_tips': [
                'Balance idea generation with implementation - set deadlines for moving from conception to action',
                'Practice explaining your ideas clearly to others who may not share your natural creative thinking style',
                'Find mentors or colleagues who can help you evaluate which ideas are most practical and valuable',
                'Create a system to prioritize your best concepts rather than pursuing every possibility',
                'Schedule regular creative time while also maintaining focus on execution and completion'
            ]
        },
        'Analytical': {
            'description': 'You search for reasons and causes and think about all the factors that might affect a situation. You value data, evidence, and logical reasoning.',
            'elaborate_description': 'Your Analytical strength means you have a natural tendency to examine information carefully and systematically. You enjoy breaking down complex problems into manageable components and examining each piece methodically. This strength makes you an excellent critical thinker who can identify flaws in reasoning and spot patterns others miss.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Systematic and methodical thinking',
                'Strong critical thinking skills',
                'Data-driven decision making',
                'Attention to detail and accuracy',
                'Logical reasoning ability'
            ],
            'personal_life': [
                'Evaluate and analyze your own decisions systematically, learning from both successes and failures through careful reflection',
                'Analyze different viewpoints when resolving conflicts or making important life decisions, considering all relevant factors',
                'Improve planning skills by examining potential challenges and solutions before committing to courses of action',
                'Use data and research to make informed personal decisions about health, finances, and relationships',
                'Develop systems for organizing information that help you make better decisions in daily life'
            ],
            'education': [
                'Break down complex academic subjects into manageable, logical components for deeper and more thorough understanding',
                'Critically analyze sources when conducting research or writing papers, evaluating credibility and bias systematically',
                'Develop analytical skills when collaborating on group projects or studying together with peers, helping the team think more clearly',
                'Create detailed study plans that account for different learning objectives and potential challenges',
                'Practice identifying assumptions and evaluating arguments in academic materials across all subjects'
            ],
            'career': [
                'Approach challenges by breaking them down into smaller, manageable parts and analyzing each component systematically',
                'Analyze data and information thoroughly to make informed decisions or recommendations that stand up to scrutiny',
                'Use critical thinking when problem-solving or developing strategies for projects or teams, ensuring logical consistency',
                'Develop systems for quality control and error checking in your work and your team output',
                'Create detailed reports and analyses that help your organization make evidence-based decisions'
            ],
            'development_tips': [
                'Remember that not all decisions require extensive analysis - practice identifying when good enough is sufficient',
                'Balance your analytical nature with intuition and emotional intelligence in interpersonal situations',
                'Learn to present your analytical findings in ways that are accessible to non-analytical thinkers',
                'Set time limits for analysis to prevent analysis paralysis on less critical decisions',
                'Seek out diverse perspectives to complement your analytical approach with other ways of thinking'
            ]
        },
        'Harmony': {
            'description': 'You look for consensus and areas of agreement, avoiding conflict whenever possible. You value peaceful, productive environments.',
            'elaborate_description': 'Your Harmony strength means you have a natural ability to sense and create agreement among people. You can often identify common ground where others see only differences. This strength makes you a natural mediator and team player who helps groups work together productively.',
            'domain': 'Relationship Building',
            'core_characteristics': [
                'Conflict avoidance and resolution skills',
                'Empathy and understanding of others perspectives',
                'Ability to find common ground',
                'Preference for cooperative environments',
                'Strong listening and communication skills'
            ],
            'personal_life': [
                'Cultivate empathy by actively listening to others and genuinely seeking to understand their feelings and perspectives',
                'Practice active communication, ensuring that your words and actions consistently promote harmony and mutual understanding',
                'Build strong, lasting relationships by demonstrating consistent respect, kindness, and compassion in all interactions',
                'Create peaceful home environments where family members feel safe expressing themselves and resolving differences constructively',
                'Develop skills in mediation and conflict resolution that you can apply in personal relationships and community settings'
            ],
            'education': [
                'Collaborate effectively with classmates on group projects, actively seeking common ground and shared goals among diverse team members',
                'Foster positive, supportive relationships with teachers, professors, or mentors to enhance learning experiences and academic success',
                'Use active listening skills when working together during study sessions or class discussions, ensuring all voices are heard and valued',
                'Help create inclusive classroom environments where diverse perspectives are respected and everyone feels comfortable participating',
                'Develop study groups and collaborative learning opportunities that leverage the strengths of different individuals'
            ],
            'career': [
                'Build strong, collaborative teams by fostering a supportive work environment where people feel valued and understood',
                'Communicate effectively and empathetically with colleagues, clients, or team members, building trust and mutual respect',
                'Resolve conflicts constructively by finding mutually beneficial solutions that address everyone core concerns and interests',
                'Help create organizational cultures that value cooperation, respect, and positive working relationships',
                'Serve as a bridge between different departments or teams with competing priorities, finding ways to align goals and efforts'
            ],
            'development_tips': [
                'Learn to recognize when harmony might be preventing necessary conversations or decisions from happening',
                'Develop skills for having difficult conversations while maintaining relationships and respect',
                'Balance your desire for harmony with the need to address important issues directly and honestly',
                'Practice asserting your own needs and perspectives while still valuing others viewpoints',
                'Recognize that some productive conflict can lead to better outcomes than artificial harmony'
            ]
        },
        'Intellection': {
            'description': 'You are characterized by your intellectual activity and introspection. You enjoy thinking, reflection, and mental stimulation.',
            'elaborate_description': 'Your Intellection strength means you have a rich inner world of thought and reflection. You enjoy thinking deeply about ideas, concepts, and experiences. This strength makes you naturally philosophical and thoughtful, often providing deep insights that come from careful consideration.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Deep thinking and reflection',
                'Intellectual curiosity',
                'Introspection and self-awareness',
                'Enjoyment of complex ideas',
                'Philosophical orientation'
            ],
            'personal_life': [
                'Engage in regular self-reflection to understand your own values, goals, and motivations at a deeper level',
                'Pursue lifelong learning through reading diverse materials, attending workshops, or engaging in online courses that challenge your thinking',
                'Cultivate curiosity about the world around you, actively seeking new experiences and knowledge that expand your understanding',
                'Create time and space for uninterrupted thinking and reflection in your daily routine',
                'Develop practices like journaling or meditation that support your natural tendency toward introspection and self-awareness'
            ],
            'education': [
                'Reflect deeply on your own learning process to identify strengths, areas for improvement, and optimal learning strategies',
                'Engage in self-directed learning by pursuing topics of personal intellectual interest beyond required coursework',
                'Develop sophisticated critical thinking skills by questioning assumptions and seeking deeper understanding of complex ideas',
                'Connect academic learning to broader philosophical questions and real-world applications',
                'Participate in advanced seminars, independent studies, or research projects that allow for deep intellectual engagement'
            ],
            'career': [
                'Continuously develop your professional expertise through advanced workshops, training programs, or mentorship opportunities',
                'Approach projects with intellectual curiosity, seeking innovative solutions to complex problems through deep analysis',
                'Cultivate an environment of continuous learning and intellectual growth within teams or organizations you work with',
                'Provide thoughtful, well-considered perspectives in meetings and decision-making processes',
                'Mentor others in developing their own critical thinking and reflective practices'
            ],
            'development_tips': [
                'Balance reflection with action - ensure your deep thinking leads to practical applications and decisions',
                'Practice communicating your complex thoughts in ways that are accessible to others with different thinking styles',
                'Set boundaries around your thinking time to prevent over-analysis or excessive introspection',
                'Seek out others who appreciate deep conversation and intellectual exchange',
                'Apply your reflective abilities to practical problem-solving as well as philosophical questions'
            ]
        },
        'Strategic': {
            'description': 'You create alternative ways to proceed and can quickly spot relevant patterns and issues in any scenario.',
            'elaborate_description': 'Your Strategic strength means you have a natural ability to see the big picture while also understanding how different elements interact. You can quickly identify patterns, anticipate obstacles, and develop multiple pathways to achieve goals. This strength allows you to navigate complexity effectively.',
            'domain': 'Strategic Thinking',
            'core_characteristics': [
                'Pattern recognition',
                'Future-oriented thinking',
                'Scenario planning ability',
                'Big picture perspective',
                'Adaptive planning skills'
            ],
            'personal_life': [
                'Plan for the future by setting clear, achievable goals and breaking them down into manageable, actionable steps with timelines',
                'Approach decision-making with a long-term perspective, carefully considering potential consequences and outcomes for important life choices',
                'Use your strategic mindset to navigate everyday challenges more effectively, anticipating obstacles and preparing contingency plans',
                'Develop personal systems and routines that optimize your time, energy, and resources toward your most important objectives',
                'Help friends and family with planning and decision-making, bringing your strategic perspective to their important life choices'
            ],
            'education': [
                'Develop comprehensive study strategies by planning ahead and anticipating potential challenges in courses and assignments',
                'Utilize advanced time management skills to ensure you meet academic deadlines while maintaining a healthy work-life balance',
                'Use your strategic thinking to develop innovative approaches when tackling complex academic problems or research projects',
                'Plan your academic career strategically, choosing courses, extracurriculars, and opportunities that align with your long-term goals',
                'Create backup plans for important academic milestones like exams, projects, and applications'
            ],
            'career': [
                'Contribute valuable strategic insights during planning discussions or decision-making meetings, helping organizations see the bigger picture',
                'Approach projects with a long-term perspective, considering potential outcomes and implications for the organization as a whole',
                'Use your strategic thinking to develop innovative solutions to complex business challenges that account for multiple variables',
                'Help teams and organizations develop strategic plans that are both ambitious and achievable',
                'Anticipate industry trends and organizational needs, positioning yourself and your team for future success'
            ],
            'development_tips': [
                'Balance long-term planning with flexibility - be prepared to adapt your strategies as circumstances change',
                'Practice communicating your strategic vision in ways that inspire and motivate others',
                'Remember to celebrate short-term wins while working toward long-term goals',
                'Seek input from others to ensure your strategic plans account for practical realities and diverse perspectives',
                'Develop skills in both strategy formulation and execution to ensure your plans translate into results'
            ]
        }
    };
    
    // Return default structure if theme not found
    const defaultStructure = {
        'description': 'This strength represents a unique talent pattern that influences your behavior and thinking.',
        'elaborate_description': 'This strength contributes to your unique approach to challenges and opportunities.',
        'domain': 'Unknown',
        'core_characteristics': ['Characteristic 1', 'Characteristic 2'],
        'personal_life': ['Apply this strength in personal contexts', 'Use it to enhance daily life'],
        'education': ['Apply in learning environments', 'Use for academic success'],
        'career': ['Apply in professional settings', 'Use for career advancement'],
        'development_tips': ['Continue developing this strength', 'Balance with other approaches']
    };
    
    return themeData[themeName] || defaultStructure;
}

/**
 * EXACT conversion of Python get_detailed_combo_analysis function
 */
function getDetailedComboAnalysis(theme1, theme2) {
    const comboData = {
        'Ideation,Analytical': {
            'name': 'Strategic Inspiration',
            'positive_synergy': 'When Ideation and Analytical come together, a powerful engine of strategic inspiration is ignited. This combination allows you to generate numerous creative ideas while critically evaluating their feasibility and potential impact. Your thought processes are fueled by both creativity and logic, enabling you to develop innovative solutions with solid foundations.',
            'risks': 'Overusing Ideation and Analytical could lead to spending excessive time exploring ideas without taking decisive action or becoming paralyzed by choosing between multiple viable options. In some cases, this combination might cause you to overthink situations, leading to indecision or analysis paralysis.',
            'practical_applications': [
                'Use in innovation teams where both creative thinking and practical evaluation are needed',
                'Excellent for research and development roles that require both imagination and rigor',
                'Valuable in strategic planning where multiple scenarios need to be generated and assessed',
                'Effective in consulting roles that require both creative problem-solving and analytical depth'
            ],
            'balance_strategies': [
                'Set clear deadlines for moving from ideation to decision-making',
                'Use the good enough principle for less critical decisions',
                'Practice rapid prototyping rather than perfect planning',
                'Seek input from more action-oriented colleagues when needed'
            ]
        }
        // Add more combinations as needed
    };
    
    const key = `${theme1},${theme2}`;
    const reverseKey = `${theme2},${theme1}`;
    
    const defaultCombo = {
        'name': `${theme1} + ${theme2} Combination`,
        'positive_synergy': `The combination of ${theme1} and ${theme2} creates a unique blend of talents that can be powerfully applied across various contexts.`,
        'risks': `When overused, this combination might lead to imbalanced approaches that favor one strength over the other.`,
        'practical_applications': [
            `Apply both ${theme1} and ${theme2} in team settings`,
            `Use this combination for complex problem-solving`,
            `Leverage both strengths in leadership roles`
        ],
        'balance_strategies': [
            `Balance the use of ${theme1} and ${theme2}`,
            `Seek feedback on when to emphasize each strength`,
            `Practice integrating both strengths smoothly`
        ]
    };
    
    return comboData[key] || comboData[reverseKey] || defaultCombo;
}

/**
 * EXACT conversion of Python generate_comprehensive_pdf function
 */
async function generateComprehensivePDF(processedData, outputFilename = "comprehensive_strength_report.pdf") {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document with A4 size and margins
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 36,
                    bottom: 36,
                    left: 36,
                    right: 36
                }
            });
            
            const chunks = [];
            
            // Collect PDF data
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve({
                    success: true,
                    buffer: pdfBuffer,
                    filename: outputFilename
                });
            });

            const candidate = processedData.candidate;
            
            // Colors matching Python version
            const primaryColor = '#2E86AB';
            const secondaryColor = '#A23B72';
            
            // 1. Comprehensive Cover Page
            doc.fontSize(16)
               .fillColor(primaryColor)
               .text('COMPREHENSIVE STRENGTHS ASSESSMENT REPORT', 36, 100, { align: 'center' });
            
            doc.moveDown(1);
            doc.fontSize(14)
               .fillColor('#666666')
               .text('A Detailed Analysis of Your Natural Talents and Potential', { align: 'center' });
            
            doc.moveDown(2);
            doc.fontSize(12)
               .fillColor('#000000')
               .text(`Prepared for: ${candidate.name}`, 36)
               .text(`Assessment Date: ${candidate.created_at.substring(0, 10)}`)
               .text(`Primary Talent Domain: ${processedData.domainScores.primary_talent_domain}`);
            
            doc.moveDown(1);
            doc.text('This comprehensive report provides detailed insights into your unique strengths pattern, practical applications, and development strategies for personal and professional growth.', {
                width: 500,
                align: 'left'
            });
            
            doc.addPage();
            
            // 2. Detailed Executive Summary
            doc.fontSize(14)
               .fillColor(primaryColor)
               .text('Detailed Executive Summary', 36, 50);
            
            doc.fontSize(10)
               .fillColor('#000000')
               .text(`This Strength-360 assessment reveals that ${candidate.name} demonstrates a distinctive talent pattern with dominant emphasis on ${processedData.domainScores.primary_talent_domain}. Your unique combination of strengths suggests particular aptitudes for roles requiring strategic thinking, innovation, and complex problem-solving. This report provides comprehensive guidance on leveraging these natural talents across all aspects of your life.`, 36, 80, {
                   width: 500,
                   align: 'justify'
               });
            
            // Domain Scores Section
            doc.moveDown(2);
            doc.fontSize(12)
               .fillColor(primaryColor)
               .text('Domain Scores & Interpretation:', 36);
            
            let yPosition = doc.y + 20;
            
            // Create domain scores table
            const domainData = [
                ['Strategic Thinking', processedData.domainScores.strategic_thinking.toFixed(1), 'Primary area of natural talent'],
                ['Relationship Building', processedData.domainScores.relationship_building.toFixed(1), 'Strong supporting capability'],
                ['Influencing', processedData.domainScores.influencing.toFixed(1), 'Developing area with potential'],
                ['Executing', processedData.domainScores.executing.toFixed(1), 'Opportunity for growth']
            ];
            
            doc.fontSize(10);
            domainData.forEach(row => {
                doc.text(`${row[0]}: ${row[1]} - ${row[2]}`, 36, yPosition);
                yPosition += 15;
            });
            
            doc.addPage();
            
            // 3. Your Top 5 Signature Strengths Analysis
            doc.fontSize(14)
               .fillColor(primaryColor)
               .text('Your Top 5 Signature Strengths', 36, 50);
            
            let currentY = 80;
            
            processedData.top5.forEach((theme, index) => {
                const themeInfo = getElaborateThemeDescription(theme.name);
                
                // Check if we need a new page
                if (currentY > 650) {
                    doc.addPage();
                    currentY = 50;
                }
                
                // Strength Header
                doc.fontSize(12)
                   .fillColor(primaryColor)
                   .text(`${index + 1}. ${theme.name} (${themeInfo.domain} - Score: ${theme.score.toFixed(1)})`, 36, currentY);
                
                currentY += 20;
                
                // Core Description
                doc.fontSize(10)
                   .fillColor('#000000')
                   .text('Core Description:', 36, currentY, { underline: true });
                currentY += 15;
                
                doc.text(themeInfo.description, 36, currentY, { width: 500 });
                currentY = doc.y + 10;
                
                // Elaborate Description
                doc.text('Detailed Analysis:', 36, currentY, { underline: true });
                currentY += 15;
                
                doc.text(themeInfo.elaborate_description, 36, currentY, { width: 500 });
                currentY = doc.y + 10;
                
                // Core Characteristics
                doc.text('Key Characteristics:', 36, currentY, { underline: true });
                currentY += 15;
                
                themeInfo.core_characteristics.forEach(char => {
                    doc.text(`• ${char}`, 50, currentY, { width: 486 });
                    currentY = doc.y + 3;
                });
                
                currentY += 15;
                
                // Personal Life Applications
                doc.text('Personal Life Applications:', 36, currentY, { underline: true });
                currentY += 15;
                
                themeInfo.personal_life.forEach(app => {
                    // Check for page break
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }
                    doc.text(`• ${app}`, 50, currentY, { width: 486 });
                    currentY = doc.y + 3;
                });
                
                currentY += 10;
                
                // Education Applications
                doc.text('Education Applications:', 36, currentY, { underline: true });
                currentY += 15;
                
                themeInfo.education.forEach(app => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }
                    doc.text(`• ${app}`, 50, currentY, { width: 486 });
                    currentY = doc.y + 3;
                });
                
                currentY += 10;
                
                // Career Applications
                doc.text('Career Applications:', 36, currentY, { underline: true });
                currentY += 15;
                
                themeInfo.career.forEach(app => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }
                    doc.text(`• ${app}`, 50, currentY, { width: 486 });
                    currentY = doc.y + 3;
                });
                
                currentY += 10;
                
                // Development Tips
                doc.text('Development Tips:', 36, currentY, { underline: true });
                currentY += 15;
                
                themeInfo.development_tips.forEach(tip => {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }
                    doc.text(`• ${tip}`, 50, currentY, { width: 486 });
                    currentY = doc.y + 3;
                });
                
                currentY += 25;
            });
            
            // 4. Strength Combinations Analysis
            doc.addPage();
            doc.fontSize(14)
               .fillColor(primaryColor)
               .text('Strength Combinations Analysis', 36, 50);
            
            currentY = 80;
            
            // Analyze top pairs from top 5
            processedData.top5Pairs.slice(0, 3).forEach((pair, index) => {
                const comboAnalysis = getDetailedComboAnalysis(pair.themeA.name, pair.themeB.name);
                
                if (currentY > 600) {
                    doc.addPage();
                    currentY = 50;
                }
                
                doc.fontSize(12)
                   .fillColor(secondaryColor)
                   .text(`${index + 1}. ${comboAnalysis.name}: ${pair.themeA.name} + ${pair.themeB.name}`, 36, currentY);
                
                currentY += 20;
                
                doc.fontSize(10)
                   .fillColor('#000000')
                   .text('Positive Synergy:', 36, currentY, { underline: true });
                currentY += 15;
                
                doc.text(comboAnalysis.positive_synergy, 36, currentY, { width: 500 });
                currentY = doc.y + 10;
                
                doc.text('Potential Risks:', 36, currentY, { underline: true });
                currentY += 15;
                
                doc.text(comboAnalysis.risks, 36, currentY, { width: 500 });
                currentY = doc.y + 15;
                
                currentY += 20;
            });
            
            // Footer
            doc.fontSize(8)
               .fillColor('#999999')
               .text('This report is generated by the Comprehensive Strengths Assessment System', 36, doc.page.height - 50);
            
            // Finalize PDF
            doc.end();
            
        } catch (error) {
            console.error('Error generating comprehensive PDF:', error);
            reject(error);
        }
    });
}

module.exports = {
    processPsychometricData,
    getElaborateThemeDescription,
    getDetailedComboAnalysis,
    generateComprehensivePDF
};