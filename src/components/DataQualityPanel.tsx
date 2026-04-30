import { useMemo, useState } from 'react';
import { DataColumn, DataRow } from '@/types/data';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useApprovalStore } from '@/hooks/useApprovalStore';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  AlertTriangle, CheckCircle2, XCircle, AlertCircle, 
  RefreshCw, ArrowRight, Database, FileCheck, Loader2, SendHorizonal
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomRulesPanel } from './CustomRulesPanel';

interface DataQualityPanelProps {
  columns: DataColumn[];
  rows: DataRow[];
  fileName?: string;
  templateId?: string | null;
  onProcessData: () => void;
}

interface QualityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  affectedRows: number[];
  column?: string;
  suggestion?: string;
}

interface QualityMetrics {
  totalRows: number;
  completenessScore: number;
  consistencyScore: number;
  validityScore: number;
  uniquenessScore: number;
  overallScore: number;
  issues: QualityIssue[];
}

export const DataQualityPanel = ({ columns, rows, fileName, templateId, onProcessData }: DataQualityPanelProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logEvent } = useAuditLog();
  const { submitForApproval } = useApprovalStore();
  const { currentUser } = useAuth();

  const qualityMetrics = useMemo((): QualityMetrics => {
    const issues: QualityIssue[] = [];
    let issueId = 0;

    // Check for missing values
    columns.forEach(col => {
      const missingRows: number[] = [];
      rows.forEach((row, index) => {
        const value = row[col.name];
        if (value === null || value === undefined || value === '') {
          missingRows.push(index);
        }
      });

      if (missingRows.length > 0) {
        const percentage = (missingRows.length / rows.length) * 100;
        issues.push({
          id: `missing-${issueId++}`,
          type: percentage > 20 ? 'error' : percentage > 5 ? 'warning' : 'info',
          category: 'Completeness',
          title: `Missing values in "${col.name}"`,
          description: `${missingRows.length} rows (${percentage.toFixed(1)}%) have missing values`,
          affectedRows: missingRows,
          column: col.name,
          suggestion: 'Consider filling with default values or removing incomplete rows',
        });
      }
    });

    // Check for duplicate rows
    const rowStrings = rows.map(row => JSON.stringify(row));
    const duplicateIndices: number[] = [];
    const seen = new Map<string, number>();
    
    rowStrings.forEach((str, index) => {
      if (seen.has(str)) {
        duplicateIndices.push(index);
      } else {
        seen.set(str, index);
      }
    });

    if (duplicateIndices.length > 0) {
      issues.push({
        id: `duplicate-${issueId++}`,
        type: duplicateIndices.length > rows.length * 0.1 ? 'error' : 'warning',
        category: 'Uniqueness',
        title: 'Duplicate rows detected',
        description: `${duplicateIndices.length} duplicate rows found`,
        affectedRows: duplicateIndices,
        suggestion: 'Review and remove duplicate entries',
      });
    }

    // Check numeric columns for outliers
    columns.filter(c => c.type === 'number').forEach(col => {
      const values = rows
        .map((r, i) => ({ value: r[col.name], index: i }))
        .filter((v): v is { value: number; index: number } => typeof v.value === 'number');

      if (values.length > 5) {
        const sorted = [...values].sort((a, b) => a.value - b.value);
        const q1 = sorted[Math.floor(values.length * 0.25)].value;
        const q3 = sorted[Math.floor(values.length * 0.75)].value;
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierRows = values
          .filter(v => v.value < lowerBound || v.value > upperBound)
          .map(v => v.index);

        if (outlierRows.length > 0) {
          issues.push({
            id: `outlier-${issueId++}`,
            type: 'warning',
            category: 'Validity',
            title: `Outliers in "${col.name}"`,
            description: `${outlierRows.length} values outside expected range [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`,
            affectedRows: outlierRows,
            column: col.name,
            suggestion: 'Review outlier values for data entry errors',
          });
        }

        // Check for negative values where unexpected
        const negativeRows = values.filter(v => v.value < 0).map(v => v.index);
        const colLower = col.name.toLowerCase();
        const shouldBePositive = ['price', 'quantity', 'count', 'amount', 'age', 'stock'].some(
          term => colLower.includes(term)
        );

        if (shouldBePositive && negativeRows.length > 0) {
          issues.push({
            id: `negative-${issueId++}`,
            type: 'error',
            category: 'Validity',
            title: `Negative values in "${col.name}"`,
            description: `${negativeRows.length} unexpected negative values found`,
            affectedRows: negativeRows,
            column: col.name,
            suggestion: 'Correct negative values - this field typically should not be negative',
          });
        }
      }
    });

    // Check for inconsistent formatting in string columns
    columns.filter(c => c.type === 'string').forEach(col => {
      const values = rows
        .map((r, i) => ({ value: r[col.name], index: i }))
        .filter((v): v is { value: string; index: number } => typeof v.value === 'string');

      // Check for inconsistent casing in categorical-looking columns
      const uniqueValues = new Set(values.map(v => v.value));
      const lowercaseMap = new Map<string, string[]>();
      
      uniqueValues.forEach(val => {
        const lower = val.toLowerCase();
        if (!lowercaseMap.has(lower)) {
          lowercaseMap.set(lower, []);
        }
        lowercaseMap.get(lower)!.push(val);
      });

      const inconsistentCases = Array.from(lowercaseMap.entries())
        .filter(([_, variants]) => variants.length > 1);

      if (inconsistentCases.length > 0 && uniqueValues.size < rows.length * 0.5) {
        const affectedRows = values
          .filter(v => inconsistentCases.some(([lower]) => v.value.toLowerCase() === lower))
          .map(v => v.index);

        issues.push({
          id: `casing-${issueId++}`,
          type: 'warning',
          category: 'Consistency',
          title: `Inconsistent casing in "${col.name}"`,
          description: `Found ${inconsistentCases.length} values with inconsistent capitalization`,
          affectedRows: affectedRows.slice(0, 10),
          column: col.name,
          suggestion: 'Standardize text casing for consistency',
        });
      }

      // Check for leading/trailing whitespace
      const whitespaceRows = values
        .filter(v => v.value !== v.value.trim())
        .map(v => v.index);

      if (whitespaceRows.length > 0) {
        issues.push({
          id: `whitespace-${issueId++}`,
          type: 'info',
          category: 'Consistency',
          title: `Whitespace issues in "${col.name}"`,
          description: `${whitespaceRows.length} values have leading/trailing whitespace`,
          affectedRows: whitespaceRows,
          column: col.name,
          suggestion: 'Trim whitespace for cleaner data',
        });
      }
    });

    // Check for email format if column looks like email
    columns.forEach(col => {
      const colLower = col.name.toLowerCase();
      if (colLower.includes('email')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidRows: number[] = [];

        rows.forEach((row, index) => {
          const value = row[col.name];
          if (typeof value === 'string' && value.length > 0 && !emailRegex.test(value)) {
            invalidRows.push(index);
          }
        });

        if (invalidRows.length > 0) {
          issues.push({
            id: `email-${issueId++}`,
            type: 'error',
            category: 'Validity',
            title: `Invalid email format in "${col.name}"`,
            description: `${invalidRows.length} rows have invalid email addresses`,
            affectedRows: invalidRows,
            column: col.name,
            suggestion: 'Correct email format or mark as missing',
          });
        }
      }
    });

    // Calculate scores
    const totalCells = rows.length * columns.length;
    let missingCells = 0;
    columns.forEach(col => {
      rows.forEach(row => {
        if (row[col.name] === null || row[col.name] === undefined || row[col.name] === '') {
          missingCells++;
        }
      });
    });

    const completenessScore = Math.round(((totalCells - missingCells) / totalCells) * 100);
    const consistencyIssues = issues.filter(i => i.category === 'Consistency').length;
    const consistencyScore = Math.max(0, 100 - consistencyIssues * 15);
    const validityIssues = issues.filter(i => i.category === 'Validity').length;
    const validityScore = Math.max(0, 100 - validityIssues * 20);
    const uniquenessScore = Math.round(((rows.length - duplicateIndices.length) / rows.length) * 100);
    const overallScore = Math.round(
      (completenessScore * 0.3 + consistencyScore * 0.2 + validityScore * 0.3 + uniquenessScore * 0.2)
    );

    return {
      totalRows: rows.length,
      completenessScore,
      consistencyScore,
      validityScore,
      uniquenessScore,
      overallScore,
      issues,
    };
  }, [columns, rows]);

  const runValidation = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setHasValidated(true);
      logEvent('validation_run', `Validation complete: Score ${qualityMetrics.overallScore}%, ${qualityMetrics.issues.length} issues found`, 'Data Studio', { 
        overallScore: qualityMetrics.overallScore, 
        issueCount: qualityMetrics.issues.length 
      });
      toast.success('Data quality validation complete');
    }, 1500);
  };

  const errorCount = qualityMetrics.issues.filter(i => i.type === 'error').length;
  const warningCount = qualityMetrics.issues.filter(i => i.type === 'warning').length;
  const infoCount = qualityMetrics.issues.filter(i => i.type === 'info').length;

  const canProcess = hasValidated && errorCount === 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Attached Quality Rules */}
      <CustomRulesPanel columns={columns} rows={rows} datasetName={fileName} templateId={templateId} />

      {/* Validation Action */}
      {!hasValidated && (
        <Card className="glass border-primary/20">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <FileCheck className="w-16 h-16 text-primary/50" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Run Data Quality Check</h3>
                <p className="text-muted-foreground max-w-md">
                  Validate your data for common quality issues before processing it to the data platform
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={runValidation}
                disabled={isValidating}
                className="mt-4"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Validation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Scores */}
      {hasValidated && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(qualityMetrics.overallScore)}`}>
                  {qualityMetrics.overallScore}%
                </div>
                <Progress 
                  value={qualityMetrics.overallScore} 
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completeness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(qualityMetrics.completenessScore)}`}>
                  {qualityMetrics.completenessScore}%
                </div>
                <Progress 
                  value={qualityMetrics.completenessScore} 
                  className="mt-2 h-1.5"
                />
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Consistency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(qualityMetrics.consistencyScore)}`}>
                  {qualityMetrics.consistencyScore}%
                </div>
                <Progress 
                  value={qualityMetrics.consistencyScore} 
                  className="mt-2 h-1.5"
                />
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Validity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(qualityMetrics.validityScore)}`}>
                  {qualityMetrics.validityScore}%
                </div>
                <Progress 
                  value={qualityMetrics.validityScore} 
                  className="mt-2 h-1.5"
                />
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Uniqueness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(qualityMetrics.uniquenessScore)}`}>
                  {qualityMetrics.uniquenessScore}%
                </div>
                <Progress 
                  value={qualityMetrics.uniquenessScore} 
                  className="mt-2 h-1.5"
                />
              </CardContent>
            </Card>
          </div>

          {/* Issues Summary */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Issues Found
                <div className="flex gap-2 ml-auto">
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errorCount} Errors
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500/20 text-yellow-600">
                      <AlertTriangle className="w-3 h-3" />
                      {warningCount} Warnings
                    </Badge>
                  )}
                  {infoCount > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {infoCount} Info
                    </Badge>
                  )}
                  {qualityMetrics.issues.length === 0 && (
                    <Badge className="flex items-center gap-1 bg-green-500">
                      <CheckCircle2 className="w-3 h-3" />
                      No Issues
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Review and fix issues before processing data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qualityMetrics.issues.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                  <p className="text-lg font-medium">All checks passed!</p>
                  <p className="text-muted-foreground">Your data is ready to be processed</p>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {qualityMetrics.issues.map((issue) => (
                    <AccordionItem key={issue.id} value={issue.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          {issue.type === 'error' && <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />}
                          {issue.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
                          {issue.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                          <div>
                            <p className="font-medium">{issue.title}</p>
                            <p className="text-sm text-muted-foreground">{issue.category}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-8 space-y-3">
                          <p className="text-sm">{issue.description}</p>
                          {issue.suggestion && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{issue.suggestion}</p>
                            </div>
                          )}
                          {issue.affectedRows.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Affected rows: {issue.affectedRows.slice(0, 5).map(r => r + 1).join(', ')}
                              {issue.affectedRows.length > 5 && ` and ${issue.affectedRows.length - 5} more...`}
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {/* Process Action */}
          <Card className={`glass ${canProcess ? 'border-green-500/30' : 'border-destructive/30'}`}>
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Database className={`w-10 h-10 ${canProcess ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div>
                    <h3 className="font-semibold">Submit for Approval</h3>
                    <p className="text-sm text-muted-foreground">
                      {canProcess 
                        ? 'Your data is ready - submit for review before committing'
                        : errorCount > 0 
                          ? `Fix ${errorCount} error${errorCount > 1 ? 's' : ''} before submitting`
                          : 'Run validation first'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={runValidation}
                    disabled={isValidating || isSubmitting}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                    Re-validate
                  </Button>
                  <Button 
                    onClick={() => {
                      if (!currentUser) {
                        toast.error('Please log in to submit');
                        return;
                      }
                      setIsSubmitting(true);

                      // Submit for approval (async, persisted to backend)
                      (async () => {
                        const requestId = await submitForApproval({
                          type: 'data_upload',
                          fileName: fileName || 'Untitled',
                          rowCount: rows.length,
                          columnCount: columns.length,
                          data: { columns, rows },
                        });

                        logEvent('approval_submitted', `Submitted data for approval: ${fileName || 'Untitled'} (${rows.length} rows)`, 'Data Studio', {
                          requestId,
                          fileName,
                          rowCount: rows.length,
                        });

                        setIsSubmitting(false);
                        if (requestId) {
                          toast.success('🎉 Submitted for approval!', {
                            description: 'Your data will be reviewed before being committed to the database.',
                          });
                          onProcessData();
                        } else {
                          toast.error('Failed to submit for approval');
                        }
                      })();
                    }}
                    disabled={!canProcess || isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <SendHorizonal className="w-4 h-4 mr-2" />
                        Submit for Approval
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};