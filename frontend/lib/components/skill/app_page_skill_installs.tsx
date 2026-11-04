// ========================================
// the skill page's skill install cards: one for the general NEAR contract
// skills and one for the skills that use the shit-1170 rex engine.
//
// the cards are static: they show the commands for installing and listing
// each skill package. they do not fetch.
import { render } from "preact";
import { Copy, Check } from "lucide-preact";
import { useState as use_state } from "preact/hooks";
import { SHIT_1170_MOUNT_ID } from "../../ts/shared/mount_ids";
// ========================================
// --- COMPONENT --------------------------
function SHIT_1170_COMPONENT_APP_PAGE_SKILL_INSTALLS_FUN() {
  const [copied, set_copied] = use_state("");

  const install_fun = async (skill_id: string, install_command: string) => {
    try {
      await navigator.clipboard.writeText(install_command);
      set_copied(skill_id);
      setTimeout(() => set_copied(""), 2000);
    } catch (err) {
      console.warn("[skill] the install command could not be copied", err);
    }
  };

  const skill_cards = [
    {
      id: "near-kit-tool-box-skills",
      title: "NEAR KIT TOOL BOX SKILLS",
      description: "GENERAL SKILLS FOR INTERACTING WITH NEAR SMART CONTRACTS.",
      install_command:
        "bunx skills add sleetplayground/near-kit-tool-box-skills",
      list_command:
        "bunx skills add sleetplayground/near-kit-tool-box-skills --list",
    },
    {
      id: "shit-1170-rex-engine-skills",
      title: "SHIT-1170 REX ENGINE SKILLS",
      description:
        "SPECIFIC SKILLS FOR INTERACTING WITH NEAR SMART CONTRACTS VIA THE SHIT-1170 REX ENGINE.",
      install_command:
        "bunx skills add huggiesdotnear/shit-1170-rex-engine-skills",
      list_command:
        "bunx skills add huggiesdotnear/shit-1170-rex-engine-skills --list",
    },
  ];

  return (
    <section>
      <h2>INSTALL SKILLS</h2>
      <p>
        ADD THESE SKILLS TO YOUR AGENT TO INTERACT WITH NEAR SMART CONTRACTS.
      </p>
      <div class="skill-install-cards">
        {skill_cards.map((skill) => (
          <div key={skill.id} class="skill-install-card">
            <h3>{skill.title}</h3>
            <p>{skill.description}</p>
            <div class="skill-install-command">
              <code>{skill.install_command}</code>
              <button
                type="button"
                onClick={() => {
                  void install_fun(skill.id, skill.install_command);
                }}
                title="copy the add command"
              >
                {copied === skill.id ? <Check size={16} /> : <Copy size={16} />}
                {copied === skill.id ? "COPIED" : "COPY"}
              </button>
            </div>
            <div class="skill-install-command">
              <code>{skill.list_command}</code>
              <button
                type="button"
                onClick={() => {
                  void install_fun(`${skill.id}_list`, skill.list_command);
                }}
                title="copy the list command"
              >
                {copied === `${skill.id}_list` ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
                {copied === `${skill.id}_list` ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_APP_PAGE_SKILL_INSTALLS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<SHIT_1170_COMPONENT_APP_PAGE_SKILL_INSTALLS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
