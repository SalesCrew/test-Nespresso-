"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, User } from "lucide-react";

interface Recommendation {
  keyword: string;
  promotorName: string;
  promotorId: string;
  confidence: number;
  rank: number;
  reasoning: string;
}

interface AIPromotorRecommendationsProps {
  selectedAssignmentId?: string;
  onPromotorSelect?: (promotorId: string, promotorName: string) => void;
}

export default function AIPromotorRecommendations({ 
  selectedAssignmentId, 
  onPromotorSelect 
}: AIPromotorRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!selectedAssignmentId) {
      setError('Bitte wählen Sie zuerst einen Einsatz aus');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/recommend-promotors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignmentId: selectedAssignmentId,
          maxRecommendations: 6 
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Empfehlungen');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromotorClick = (promotor: Recommendation) => {
    if (onPromotorSelect) {
      onPromotorSelect(promotor.promotorId, promotor.promotorName);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
    return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white';
  };

  return (
    <div className="fixed bottom-20 left-8 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-white" />
            <h3 className="text-white font-medium">AI Empfehlungen</h3>
          </div>
          <Button
            onClick={fetchRecommendations}
            disabled={loading || !selectedAssignmentId}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {error && (
          <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}

        {!selectedAssignmentId && !error && (
          <div className="text-gray-500 text-sm text-center py-6">
            Wählen Sie einen Einsatz aus, um AI-Empfehlungen zu erhalten
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-3">
              {recommendations.length} Empfehlungen gefunden
            </div>
            
            {recommendations.map((rec, index) => (
              <div
                key={rec.keyword}
                onClick={() => handlePromotorClick(rec)}
                className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50 cursor-pointer transition-all"
              >
                {/* Rank Badge */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${getRankColor(rec.rank)}`}>
                  {rec.rank}
                </div>

                {/* Promotor Info */}
                <div className="flex-1">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900 text-sm">
                      {rec.promotorName}
                    </span>
                  </div>
                  
                  {/* Confidence */}
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(rec.confidence)}`}>
                      {Math.round(rec.confidence * 100)}% Match
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500 mb-2" />
            <div className="text-sm text-gray-500">
              AI analysiert verfügbare Promotoren...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
