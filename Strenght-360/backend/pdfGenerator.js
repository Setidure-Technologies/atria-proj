const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Process psychometric test data from webhook and prepare for PDF report generation
 */
function processWebhookData(webhookData) {
  // Extract the main data object - handle different possible structures
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
  
  // Candidate information
  const candidate = {
    id: data.id || 'Unknown',
    name: data.student_name,
    email: data.student_email,
    created_at: data.created_at || new Date().toISOString()
  };
  
  // Domain scores with proper fallbacks
  const detailedScores = data.detailed_scores || {};
  const domainScores = {
    executing: parseFloat(detailedScores.executing || data.executing_score || 0),
    influencing: parseFloat(detailedScores.influencing || data.influencing_score || 0),
    relationship_building: parseFloat(detailedScores.relationshipBuilding || data.relationship_building_score || 0),
    strategic_thinking: parseFloat(detailedScores.strategicThinking || data.strategic_thinking_score || 0),
    primary_talent_domain: data.primary_talent_domain || 'Not Specified'
  };
  
  // Process subdomain/strength scores
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
  
  return {
    candidate,
    domainScores,
    subdomains,
    rawData: data
  };
}

/**
 * Generate strengths descriptions based on top themes
 */
function generateStrengthDescriptions(topThemes) {
  const descriptions = {
    'Achiever': 'People exceptionally talented in the Achiever theme work hard and possess a great deal of stamina. They take immense satisfaction in being busy and productive.',
    'Analytical': 'People exceptionally talented in the Analytical theme search for reasons and causes. They have the ability to think about all the factors that might affect a situation.',
    'Communication': 'People exceptionally talented in the Communication theme generally find it easy to put their thoughts into words. They are good conversationalists and presenters.',
    'Relator': 'People exceptionally talented in the Relator theme enjoy close relationships with others. They find deep satisfaction in working hard with friends to achieve a goal.',
    'Strategic': 'People exceptionally talented in the Strategic theme create alternative ways to proceed. Faced with any given scenario, they can quickly spot the relevant patterns and issues.',
    'Focus': 'People exceptionally talented in the Focus theme can take a direction, follow through, and make the corrections necessary to stay on track.',
    'Responsibility': 'People exceptionally talented in the Responsibility theme take psychological ownership of what they say they will do. They are committed to stable values such as honesty and loyalty.',
    'Developer': 'People exceptionally talented in the Developer theme recognize and cultivate the potential in others. They spot the signs of each small improvement and derive satisfaction from evidence of progress.',
    'Empathy': 'People exceptionally talented in the Empathy theme can sense other people\'s feelings by imagining themselves in others\' lives or situations.',
    'Individualization': 'People exceptionally talented in the Individualization theme are intrigued with the unique qualities of each person. They have a gift for figuring out how different people can work together productively.'
  };
  
  return topThemes.map(theme => ({
    name: theme,
    description: descriptions[theme] || `Strong talent in ${theme} - a key strength that drives success and engagement.`
  }));
}

/**
 * Generate PDF report
 */
async function generatePDFReport(processedData, outputPath) {
  const { candidate, domainScores, subdomains } = processedData;
  
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });
      
      // Pipe the document to a write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(24).fillColor('#2563eb').text('StrengthsFinder 360 Report', 50, 50);
      doc.fontSize(16).fillColor('#64748b').text('Personalized Talent Assessment Results', 50, 85);
      
      // Candidate Information
      doc.fontSize(18).fillColor('#1e293b').text('Candidate Information', 50, 130);
      doc.fontSize(12).fillColor('#475569');
      doc.text(`Name: ${candidate.name}`, 50, 160);
      doc.text(`Email: ${candidate.email}`, 50, 180);
      doc.text(`Assessment Date: ${new Date(candidate.created_at).toLocaleDateString()}`, 50, 200);
      doc.text(`Report ID: ${candidate.id}`, 50, 220);
      
      // Domain Scores Section
      doc.fontSize(18).fillColor('#1e293b').text('Talent Domain Scores', 50, 260);
      
      let yPosition = 290;
      const domains = [
        { name: 'Executing', score: domainScores.executing, color: '#dc2626' },
        { name: 'Influencing', score: domainScores.influencing, color: '#ea580c' },
        { name: 'Relationship Building', score: domainScores.relationship_building, color: '#16a34a' },
        { name: 'Strategic Thinking', score: domainScores.strategic_thinking, color: '#2563eb' }
      ];
      
      domains.forEach(domain => {
        // Domain name
        doc.fontSize(14).fillColor('#374151').text(domain.name, 50, yPosition);
        
        // Score
        doc.fontSize(12).fillColor('#6b7280').text(`${domain.score.toFixed(1)}`, 250, yPosition + 2);
        
        // Progress bar background
        doc.rect(300, yPosition + 2, 200, 12).fillColor('#e5e7eb').fill();
        
        // Progress bar fill
        const fillWidth = (domain.score / 5) * 200; // Assuming max score of 5
        doc.rect(300, yPosition + 2, fillWidth, 12).fillColor(domain.color).fill();
        
        yPosition += 30;
      });
      
      // Primary Talent Domain
      doc.fontSize(16).fillColor('#1e293b').text('Primary Talent Domain', 50, yPosition + 20);
      doc.fontSize(14).fillColor('#2563eb').text(domainScores.primary_talent_domain, 50, yPosition + 45);
      
      // Top Themes Section
      doc.fontSize(18).fillColor('#1e293b').text('Top Talent Themes', 50, yPosition + 80);
      
      // Sort themes by score and get top 5
      const sortedThemes = Object.entries(subdomains)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      let themeYPosition = yPosition + 110;
      sortedThemes.forEach(([theme, score], index) => {
        doc.fontSize(14).fillColor('#374151').text(`${index + 1}. ${theme}`, 50, themeYPosition);
        doc.fontSize(12).fillColor('#6b7280').text(`Score: ${typeof score === 'number' ? score.toFixed(1) : score}`, 250, themeYPosition + 2);
        themeYPosition += 25;
      });
      
      // Add new page for detailed descriptions
      doc.addPage();
      
      // Detailed Theme Descriptions
      doc.fontSize(18).fillColor('#1e293b').text('Your Top Talent Themes - Detailed Insights', 50, 50);
      
      const topThemeNames = sortedThemes.map(([theme]) => theme);
      const descriptions = generateStrengthDescriptions(topThemeNames);
      
      let descYPosition = 90;
      descriptions.forEach((desc, index) => {
        // Check if we need a new page
        if (descYPosition > 700) {
          doc.addPage();
          descYPosition = 50;
        }
        
        doc.fontSize(14).fillColor('#2563eb').text(`${index + 1}. ${desc.name}`, 50, descYPosition);
        doc.fontSize(11).fillColor('#374151').text(desc.description, 50, descYPosition + 20, {
          width: 500,
          align: 'justify'
        });
        
        descYPosition += 80;
      });
      
      // Footer
      doc.fontSize(10).fillColor('#9ca3af').text(
        'This report is generated by StrengthsFinder 360 Assessment Tool',
        50,
        doc.page.height - 50
      );
      
      // Finalize the document
      doc.end();
      
      stream.on('finish', () => {
        console.log('PDF report generated successfully:', outputPath);
        resolve(outputPath);
      });
      
      stream.on('error', (error) => {
        console.error('Error writing PDF:', error);
        reject(error);
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}

/**
 * Main function to generate PDF from webhook data
 */
async function generateReportFromWebhook(webhookData, outputFileName = null) {
  try {
    // Process the webhook data
    const processedData = processWebhookData(webhookData);
    
    // Generate output filename if not provided
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = outputFileName || `strength-report-${processedData.candidate.name.replace(/\s+/g, '_')}-${timestamp}.pdf`;
    const outputPath = path.join(__dirname, 'reports', fileName);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(outputPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate the PDF
    const pdfPath = await generatePDFReport(processedData, outputPath);
    
    return {
      success: true,
      filePath: pdfPath,
      fileName: fileName,
      candidate: processedData.candidate
    };
    
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateReportFromWebhook,
  processWebhookData,
  generatePDFReport
};