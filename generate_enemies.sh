#!/bin/bash
# Generate 50 apocalyptic enemy characters

DRAW_PY="/home/bhoult/programming/ai-scrape/draw.py"
OUTPUT_DIR="/home/bhoult/programming/kaleidoclasm/images/photos"

# Arrays of variations
types=("raider" "cannibal" "marauder" "bandit" "psycho" "savage" "berserker" "mutant" "feral human" "crazed survivor")
genders=("male" "female")
builds=("muscular" "gaunt" "hulking" "wiry" "scarred" "tattooed" "emaciated" "brutish")
weapons=("rusty machete" "spiked baseball bat" "makeshift axe" "meat cleaver" "chain" "pipe wrench" "jagged knife" "sharpened bone" "barbed wire club" "fire axe")
armor=("wearing bone armor" "with scrap metal armor" "in bloodstained rags" "with leather straps and spikes" "wearing a skull mask" "with tribal bones and teeth" "in torn military gear" "with chains wrapped around arms" "wearing a hockey mask" "with a gas mask and hood")
features=("blood-covered face" "crazed eyes" "filed teeth" "ritual scars" "war paint" "open wounds" "missing eye" "burned skin" "tribal tattoos" "stitched face")
poses=("aggressive stance" "mid-attack pose" "screaming" "crouching menacingly" "raising weapon" "snarling" "lunging forward" "battle ready stance")
backgrounds=("burning wasteland" "bloody camp" "dark ruins" "corpse-strewn battlefield" "smoky hellscape" "abandoned slaughterhouse" "toxic fog" "fire-lit darkness")

count=0
total=50

echo "Generating $total apocalyptic enemy characters..."
echo "Output directory: $OUTPUT_DIR"

while [ $count -lt $total ]; do
    # Pick random elements
    type=${types[$((RANDOM % ${#types[@]}))]}
    gender=${genders[$((RANDOM % ${#genders[@]}))]}
    build=${builds[$((RANDOM % ${#builds[@]}))]}
    weapon=${weapons[$((RANDOM % ${#weapons[@]}))]}
    armor_piece=${armor[$((RANDOM % ${#armor[@]}))]}
    feature=${features[$((RANDOM % ${#features[@]}))]}
    pose=${poses[$((RANDOM % ${#poses[@]}))]}
    background=${backgrounds[$((RANDOM % ${#backgrounds[@]}))]}

    # Build prompt
    prompt="full body shot of a $build $gender $type, $feature, $armor_piece, holding a $weapon, $pose, post-apocalyptic, $background background, menacing, violent, gritty, cinematic lighting, detailed, 4k quality, concept art style"

    # Generate unique filename
    filename="enemy_$(printf '%03d' $count).jpg"
    output="$OUTPUT_DIR/$filename"

    echo ""
    echo "[$((count + 1))/$total] Generating: $filename"
    echo "Prompt: $prompt"

    # Generate image (512x768 for full body portrait orientation)
    "$DRAW_PY" "$prompt" --output "$output" --width 512 --height 768 --steps 6

    if [ $? -eq 0 ]; then
        echo "Saved: $output"
        count=$((count + 1))
    else
        echo "Failed to generate image, retrying..."
    fi
done

echo ""
echo "Generation complete! $count enemy characters saved to $OUTPUT_DIR"
