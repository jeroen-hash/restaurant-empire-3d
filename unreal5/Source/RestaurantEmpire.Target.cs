using UnrealBuildTool;
using System.Collections.Generic;

public class RestaurantEmpireTarget : TargetRules
{
    public RestaurantEmpireTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        ExtraModuleNames.Add("RestaurantEmpire");
    }
}
