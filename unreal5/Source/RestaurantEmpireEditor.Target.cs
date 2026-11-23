using UnrealBuildTool;
using System.Collections.Generic;

public class RestaurantEmpireEditorTarget : TargetRules
{
    public RestaurantEmpireEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        ExtraModuleNames.Add("RestaurantEmpire");
    }
}
