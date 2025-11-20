import { createFileRoute } from '@tanstack/react-router';
import { ArchitectureSection } from '../components/sections/ArchitectureSection';
import { ComparisonSection } from '../components/sections/ComparisonSection';
import { ComparisonTableSection } from '../components/sections/ComparisonTableSection';
import { CustomFieldsSection } from '../components/sections/CustomFieldsSection';
import { DatabaseSetupSection } from '../components/sections/DatabaseSetupSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { FinalCTASection } from '../components/sections/FinalCTASection';
import { GitHubStatsSection } from '../components/sections/GitHubStatsSection';
import { HeroSection } from '../components/sections/HeroSection';
import { QuickStartSection } from '../components/sections/QuickStartSection';
import { RealWorldExampleSection } from '../components/sections/RealWorldExampleSection';
import { TechnicalHighlightsSection } from '../components/sections/TechnicalHighlightsSection';
import { WhatYouGetSection } from '../components/sections/WhatYouGetSection';
import { WhoIsThisForSection } from '../components/sections/WhoIsThisForSection';

export const Route = createFileRoute('/')({
    component: Index
});

function Index() {
    return (
        <div className="w-full">
            <HeroSection />
            <QuickStartSection />
            <WhatYouGetSection />
            <CustomFieldsSection />
            <DatabaseSetupSection />
            <FeaturesSection />
            <ComparisonSection />
            <ArchitectureSection />
            <WhoIsThisForSection />
            <TechnicalHighlightsSection />
            <RealWorldExampleSection />
            <ComparisonTableSection />
            <GitHubStatsSection />
            <FinalCTASection />
        </div>
    );
}
