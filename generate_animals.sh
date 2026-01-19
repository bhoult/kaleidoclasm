#!/bin/bash
# Generate 50 apocalyptic wild animal images

DRAW_PY="/home/bhoult/programming/ai-scrape/draw.py"
OUTPUT_DIR="/home/bhoult/programming/kaleidoclasm/images/photos"

# Arrays of variations
animals=("wolf" "wild dog" "feral pig" "bear" "feral dog pack" "mutant rat" "rabid coyote" "wild boar" "mountain lion" "feral cat")
conditions=("mangy" "scarred" "bloodied" "emaciated" "muscular" "rabid" "feral" "aggressive" "starving" "mutated")
features=("bared teeth" "glowing eyes" "foam at mouth" "bloody muzzle" "torn ear" "missing eye" "matted fur" "open wounds" "radiation burns" "patchy fur")
poses=("snarling" "mid-attack" "prowling" "crouching to pounce" "standing aggressive" "running toward camera" "hunting stance" "circling prey")
backgrounds=("burnt forest" "ruined city streets" "wasteland" "abandoned building" "toxic fog" "moonlit ruins" "bloody campsite" "overgrown highway" "radioactive zone" "desolate farm")
times=("night" "dusk" "overcast day" "foggy morning" "harsh sunlight" "stormy")

count=0
total=20

echo "Generating $total apocalyptic wild animal images..."
echo "Output directory: $OUTPUT_DIR"

while [ $count -lt $total ]; do
    # Pick random elements
    animal=${animals[$((RANDOM % ${#animals[@]}))]}
    condition=${conditions[$((RANDOM % ${#conditions[@]}))]}
    feature=${features[$((RANDOM % ${#features[@]}))]}
    pose=${poses[$((RANDOM % ${#poses[@]}))]}
    background=${backgrounds[$((RANDOM % ${#backgrounds[@]}))]}
    time=${times[$((RANDOM % ${#times[@]}))]}

    # Build prompt
    prompt="full body shot of a $condition $animal, $feature, $pose, post-apocalyptic $background background, $time, dangerous, feral, gritty, cinematic lighting, detailed, 4k quality, concept art style, wildlife photography"

    # Generate unique filename
    filename="animal_$(printf '%03d' $count).jpg"
    output="$OUTPUT_DIR/$filename"

    echo ""
    echo "[$((count + 1))/$total] Generating: $filename"
    echo "Prompt: $prompt"

    # Generate image (512x512 for animals)
    "$DRAW_PY" "$prompt" --output "$output" --width 512 --height 512 --steps 6

    if [ $? -eq 0 ]; then
        echo "Saved: $output"
        count=$((count + 1))
    else
        echo "Failed to generate image, retrying..."
    fi
done

echo ""
echo "Generation complete! $count animal images saved to $OUTPUT_DIR"
